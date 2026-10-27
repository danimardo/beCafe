CREATE TABLE `mensaje_dia` (
	`usuario_id` text NOT NULL,
	`dia` text NOT NULL,
	`mensaje_id` text NOT NULL,
	`vuelta` integer NOT NULL,
	`asignado_en` text NOT NULL,
	PRIMARY KEY(`usuario_id`, `dia`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mensaje_dia_vuelta_valida" CHECK("mensaje_dia"."vuelta" >= 1),
	CONSTRAINT "mensaje_dia_dia_valido" CHECK(length("mensaje_dia"."dia") = 10)
);
--> statement-breakpoint
CREATE INDEX `mensaje_dia_vuelta` ON `mensaje_dia` (`usuario_id`,`vuelta`);