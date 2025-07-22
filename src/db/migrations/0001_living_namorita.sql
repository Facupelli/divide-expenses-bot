CREATE TABLE `expense_participants` (
	`expense_id` integer NOT NULL,
	`user_name` text NOT NULL,
	PRIMARY KEY(`expense_id`, `user_name`),
	FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_name`) REFERENCES `users`(`name`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payer` text NOT NULL,
	`amount` integer,
	`description` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_expenses`("id", "payer", "amount", "description") SELECT "id", "payer", "amount", "description" FROM `expenses`;--> statement-breakpoint
DROP TABLE `expenses`;--> statement-breakpoint
ALTER TABLE `__new_expenses` RENAME TO `expenses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;