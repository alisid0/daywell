CREATE TABLE `food_operations` (
	`user_id` text NOT NULL,
	`operation_id` text NOT NULL,
	`request_hash` text NOT NULL,
	`revision` integer NOT NULL,
	`effect` text NOT NULL,
	`created_at` text NOT NULL,
	`undone_by` text,
	PRIMARY KEY(`user_id`, `operation_id`)
);
--> statement-breakpoint
CREATE TABLE `food_spaces` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`data` text NOT NULL,
	`last_write_id` text NOT NULL
);
