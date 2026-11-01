CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"item" text NOT NULL,
	"quantity" integer NOT NULL,
	"status" text NOT NULL,
	"placed_at" timestamp with time zone NOT NULL,
	"shipped_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	CONSTRAINT "orders_quantity_positive" CHECK ("orders"."quantity" > 0),
	CONSTRAINT "orders_status_columns" CHECK (("orders"."status" = 'placed' and "orders"."shipped_at" is null and "orders"."cancelled_at" is null and "orders"."cancellation_reason" is null)
       or ("orders"."status" = 'shipped' and "orders"."shipped_at" is not null and "orders"."cancelled_at" is null and "orders"."cancellation_reason" is null)
       or ("orders"."status" = 'cancelled' and "orders"."shipped_at" is null and "orders"."cancelled_at" is not null and "orders"."cancellation_reason" is not null))
);
