import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

const directive =
  /^\s*\*?\s*(?:(?:oxlint|eslint)-(?:disable|enable)|@ts-(?:expect-error|ignore|nocheck))/u;

const typeScriptDirective =
  /^\s*\*?\s*@ts-(?:expect-error|ignore|nocheck)(?![\w-])(.*)$/su;

const emptyComment = /^[\s*]*$/u;

/** Require every lint or type-checker suppression to say why. */
export const requireSuppressionReasonRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Require every lint or type-checker suppression to say why.",
    },
    messages: {
      lint: "Say why: end the directive with `-- reason` or put a comment on the line above.",
      typeScript:
        "Say why: write the reason after the directive or in a comment on the line above.",
    },
  },
  createOnce(context) {
    return {
      Program() {
        const { sourceCode } = context;
        const comments = sourceCode.getAllComments();
        const ownLineCommentByEndLine = new Map<number, ESTree.Comment>();

        for (const comment of comments) {
          const { line, column } = comment.loc.start;
          const before = (sourceCode.lines[line - 1] ?? "").slice(0, column);

          if (before.trim() === "")
            ownLineCommentByEndLine.set(comment.loc.end.line, comment);
        }

        // A reason may sit above a run of other directives, so those are skipped on the way up.
        const explainedAbove = (comment: ESTree.Comment): boolean => {
          let above = ownLineCommentByEndLine.get(comment.loc.start.line - 1);

          while (
            above !== undefined &&
            (directive.test(above.value) || emptyComment.test(above.value))
          )
            above = ownLineCommentByEndLine.get(above.loc.start.line - 1);

          return above !== undefined;
        };

        for (const found of sourceCode.getDisableDirectives().directives) {
          const unexplained =
            found.type !== "enable" &&
            found.justification.trim() === "" &&
            !explainedAbove(found.node);

          if (unexplained)
            context.report({ loc: found.node.loc, messageId: "lint" });
        }

        for (const comment of comments) {
          const after = typeScriptDirective.exec(comment.value)?.[1];

          if (after === undefined) continue;

          const reason = after.replace(/^[\s:-]+/u, "").trim();

          if (reason === "" && !explainedAbove(comment))
            context.report({ loc: comment.loc, messageId: "typeScript" });
        }
      },
    };
  },
});
