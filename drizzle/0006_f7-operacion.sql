CREATE TABLE `copia_seguridad` (
	`id` text PRIMARY KEY NOT NULL,
	`iniciada_en` text NOT NULL,
	`finalizada_en` text,
	`estado` text NOT NULL,
	`tamano` integer,
	`sha256` text,
	`clave_objeto` text,
	`codigo_error` text,
	`estado_http` integer,
	CONSTRAINT "copia_seguridad_correcta_completa" CHECK("copia_seguridad"."estado" <> 'correcta' OR ("copia_seguridad"."tamano" IS NOT NULL AND "copia_seguridad"."sha256" IS NOT NULL AND "copia_seguridad"."clave_objeto" IS NOT NULL)),
	CONSTRAINT "copia_seguridad_fallida_con_codigo" CHECK("copia_seguridad"."estado" <> 'fallida' OR "copia_seguridad"."codigo_error" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `copia_seguridad_iniciada` ON `copia_seguridad` (`iniciada_en`);--> statement-breakpoint
CREATE TABLE `prueba_restauracion` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`realizada_el` text NOT NULL,
	`resultado` text NOT NULL,
	`notas` text,
	`anotada_en` text NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "prueba_restauracion_notas_longitud" CHECK("prueba_restauracion"."notas" IS NULL OR length("prueba_restauracion"."notas") <= 500)
);
