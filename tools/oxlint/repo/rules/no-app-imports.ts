import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

import { defineRule } from "@oxlint/plugins";
import { z } from "zod";

import type { ESTree } from "@oxlint/plugins";

interface App {
  readonly name: string;
  readonly directory: string;
}

const Manifest = z.object({ name: z.string() });

const Specifier = z.string();

const isInside = ({
  path,
  directory,
}: {
  readonly path: string;
  readonly directory: string;
}): boolean => path === directory || path.startsWith(directory + sep);

/** The nearest directory above the file that holds `package.json` and `apps/`. */
const findRoot = (directory: string): string | undefined => {
  if (
    existsSync(join(directory, "package.json")) &&
    existsSync(join(directory, "apps"))
  )
    return directory;

  const parent = dirname(directory);

  return parent === directory ? undefined : findRoot(parent);
};

const readApp = (directory: string): ReadonlyArray<App> => {
  const manifestPath = join(directory, "package.json");

  if (!existsSync(manifestPath)) return [];

  const manifest = Manifest.safeParse(
    JSON.parse(readFileSync(manifestPath, "utf8")),
  );

  return manifest.success ? [{ name: manifest.data.name, directory }] : [];
};

const readApps = (root: string): ReadonlyArray<App> =>
  readdirSync(join(root, "apps"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => readApp(join(root, "apps", entry.name)));

// Oxlint calls the rule once per file. The cache keeps that to one disk read per directory.
const appsByDirectory = new Map<string, ReadonlyArray<App>>();

const appsFor = (filename: string): ReadonlyArray<App> => {
  const directory = dirname(filename);
  const cached = appsByDirectory.get(directory);

  if (cached !== undefined) return cached;

  const root = findRoot(directory);
  const apps = root === undefined ? [] : readApps(root);

  appsByDirectory.set(directory, apps);

  return apps;
};

const importsApp = ({
  app,
  filename,
  specifier,
}: {
  readonly app: App;
  readonly filename: string;
  readonly specifier: string;
}): boolean =>
  specifier.startsWith(".")
    ? isInside({
        path: resolve(dirname(filename), specifier),
        directory: app.directory,
      })
    : specifier === app.name || specifier.startsWith(`${app.name}/`);

/** Reject an import of an app from a file outside that app. */
export const noAppImportsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow an import of an app from a file outside that app.",
    },
    messages: {
      appImport:
        "Do not import the app {{app}} from outside it. Move the shared code to a package under packages/.",
    },
  },
  createOnce(context) {
    const check = ({
      node,
      specifier,
    }: {
      readonly node: ESTree.Node;
      readonly specifier: string;
    }): void => {
      const { filename } = context;

      const imported = appsFor(filename).find(
        (app) =>
          !isInside({ path: filename, directory: app.directory }) &&
          importsApp({ app, filename, specifier }),
      );

      if (imported !== undefined) {
        context.report({
          node,
          messageId: "appImport",
          data: { app: imported.name },
        });
      }
    };

    const checkLiteral = (source: ESTree.StringLiteral): void => {
      check({ node: source, specifier: source.value });
    };

    return {
      ImportDeclaration(node) {
        checkLiteral(node.source);
      },
      ExportAllDeclaration(node) {
        checkLiteral(node.source);
      },
      ExportNamedDeclaration(node) {
        if (node.source !== null) checkLiteral(node.source);
      },
      TSImportType(node) {
        checkLiteral(node.source);
      },
      ImportExpression(node) {
        const { source } = node;

        if (source.type !== "Literal") return;

        const specifier = Specifier.safeParse(source.value);

        if (specifier.success)
          check({ node: source, specifier: specifier.data });
      },
    };
  },
});
