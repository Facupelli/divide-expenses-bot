CREATE TABLE `expense_operations` (
	`idempotency_key` text PRIMARY KEY NOT NULL,
	`payload_hash` text NOT NULL,
	`group_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `outbound_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`update_id` integer NOT NULL,
	`sequence` integer NOT NULL,
	`chat_id` text NOT NULL,
	`text` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	FOREIGN KEY (`update_id`) REFERENCES `telegram_updates`(`update_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbound_messages_update_sequence_unique` ON `outbound_messages` (`update_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `telegram_updates` (
	`update_id` integer PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`last_error` text,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
ALTER TABLE `expenses` ADD `operation_key` text REFERENCES expense_operations(idempotency_key);--> statement-breakpoint
ALTER TABLE `expenses` ADD `operation_index` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `expenses_operation_item_unique` ON `expenses` (`operation_key`,`operation_index`);