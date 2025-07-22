CREATE TABLE `expense_participants` (
	`expense_id` integer NOT NULL,
	`user_name` text NOT NULL,
	`group_id` integer NOT NULL,
	PRIMARY KEY(`expense_id`, `user_name`),
	FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_name`,`group_id`) REFERENCES `users`(`name`,`group_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`payer` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` text NOT NULL,
	`isActive` integer NOT NULL,
	`name` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`name` text NOT NULL,
	`group_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`name`, `group_id`),
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
