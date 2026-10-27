CREATE TABLE `instalacion_app` (
	`usuario_id` text PRIMARY KEY NOT NULL,
	`estado` text NOT NULL,
	`instante` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "instalacion_app_estado_valido" CHECK("instalacion_app"."estado" IN ('instalada', 'rechazada'))
);
