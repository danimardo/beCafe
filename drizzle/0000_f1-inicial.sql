CREATE TABLE `registro_auditoria` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`accion` text NOT NULL,
	`objeto_tipo` text NOT NULL,
	`objeto_id` text NOT NULL,
	`detalle` text NOT NULL,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `registro_auditoria_objeto` ON `registro_auditoria` (`objeto_tipo`,`objeto_id`);--> statement-breakpoint
CREATE TABLE `usuario` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`email` text NOT NULL,
	`rol` text NOT NULL,
	`estado` text NOT NULL,
	`privacidad_version` integer,
	`privacidad_leida_en` text,
	`creado_en` text NOT NULL,
	`baja_en` text,
	CONSTRAINT "usuario_rol_valido" CHECK("usuario"."rol" IN ('miembro', 'administrador')),
	CONSTRAINT "usuario_estado_valido" CHECK("usuario"."estado" IN ('activo', 'baja')),
	CONSTRAINT "usuario_nombre_valido" CHECK(length("usuario"."nombre") BETWEEN 1 AND 80 AND "usuario"."nombre" = trim("usuario"."nombre"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuario_email_unique` ON `usuario` (`email`);--> statement-breakpoint
CREATE INDEX `usuario_rol_estado` ON `usuario` (`rol`,`estado`);--> statement-breakpoint
CREATE TABLE `credencial` (
	`usuario_id` text PRIMARY KEY NOT NULL,
	`hash` text NOT NULL,
	`intentos_fallidos` integer DEFAULT 0 NOT NULL,
	`bloqueado_hasta` text,
	`actualizada_en` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "credencial_intentos_no_negativos" CHECK("credencial"."intentos_fallidos" >= 0)
);
--> statement-breakpoint
CREATE TABLE `enlace_acceso` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`tipo` text NOT NULL,
	`token_hash` text NOT NULL,
	`expira_en` text NOT NULL,
	`usado_en` text,
	`anulado_en` text,
	`creado_por` text,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "enlace_acceso_tipo_valido" CHECK("enlace_acceso"."tipo" IN ('invitacion', 'recuperacion'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enlace_acceso_token_hash_unique` ON `enlace_acceso` (`token_hash`);--> statement-breakpoint
CREATE INDEX `enlace_acceso_usuario` ON `enlace_acceso` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `sesion` (
	`id_hash` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`creada_en` text NOT NULL,
	`ultimo_uso_en` text NOT NULL,
	`ultima_autenticacion_en` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sesion_usuario` ON `sesion` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `configuracion` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL,
	`modificado_por` text NOT NULL,
	`modificado_en` text NOT NULL
);
