CREATE TABLE `frase_entregada` (
	`usuario_id` text NOT NULL,
	`lista` text NOT NULL,
	`ciclo` integer NOT NULL,
	`frase_id` text NOT NULL,
	`entregada_en` text NOT NULL,
	PRIMARY KEY(`usuario_id`, `lista`, `ciclo`, `frase_id`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "frase_entregada_lista_valida" CHECK("frase_entregada"."lista" IN ('registro', 'saludo')),
	CONSTRAINT "frase_entregada_ciclo_valido" CHECK("frase_entregada"."ciclo" >= 1)
);
--> statement-breakpoint
CREATE INDEX `frase_entregada_ultima` ON `frase_entregada` (`usuario_id`,`lista`,`entregada_en`);