CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payer` text NOT NULL,
	`amount` integer,
	`description` text NOT NULL,
	`split_between` integer NOT NULL,
	FOREIGN KEY (`split_between`) REFERENCES `users`(`name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`name` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
