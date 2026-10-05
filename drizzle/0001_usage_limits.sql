CREATE TABLE `usage_limits` (
	`user_id` text NOT NULL,
	`feature` text NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`user_id`, `feature`)
);
