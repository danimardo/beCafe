CREATE TABLE `sesion_cerrada_por_baja` (
	`id_hash` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`cerrada_en` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sesion_cerrada_por_baja_usuario` ON `sesion_cerrada_por_baja` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `aportacion` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`registrada_por` text NOT NULL,
	`importe` integer NOT NULL,
	`origen` text NOT NULL,
	`registrada_en` text NOT NULL,
	`estado` text DEFAULT 'vigente' NOT NULL,
	`anulado_por` text,
	`anulado_en` text,
	`motivo_anulacion` text,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`registrada_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "aportacion_importe_valido" CHECK("aportacion"."importe" > 0 AND ("aportacion"."importe" <= 50000 OR "aportacion"."origen" = 'baja')),
	CONSTRAINT "aportacion_anulacion_valida" CHECK(("aportacion"."estado" = 'vigente' AND "aportacion"."anulado_por" IS NULL AND "aportacion"."anulado_en" IS NULL AND "aportacion"."motivo_anulacion" IS NULL)
			OR ("aportacion"."estado" = 'anulado' AND "aportacion"."anulado_por" IS NOT NULL AND "aportacion"."anulado_en" IS NOT NULL AND "aportacion"."motivo_anulacion" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aportacion_cliente_id_unique` ON `aportacion` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `arqueo` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`realizado_en` text NOT NULL,
	`saldo_teorico` integer NOT NULL,
	`contado` integer NOT NULL,
	`diferencia` integer NOT NULL,
	`estado` text DEFAULT 'vigente' NOT NULL,
	`anulado_por` text,
	`anulado_en` text,
	`motivo_anulacion` text,
	FOREIGN KEY (`admin_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "arqueo_contado_valido" CHECK("arqueo"."contado" >= 0),
	CONSTRAINT "arqueo_diferencia_coherente" CHECK("arqueo"."diferencia" = "arqueo"."contado" - "arqueo"."saldo_teorico"),
	CONSTRAINT "arqueo_anulacion_valida" CHECK(("arqueo"."estado" = 'vigente' AND "arqueo"."anulado_por" IS NULL AND "arqueo"."anulado_en" IS NULL AND "arqueo"."motivo_anulacion" IS NULL)
			OR ("arqueo"."estado" = 'anulado' AND "arqueo"."anulado_por" IS NOT NULL AND "arqueo"."anulado_en" IS NOT NULL AND "arqueo"."motivo_anulacion" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `arqueo_realizado` ON `arqueo` (`realizado_en`);--> statement-breakpoint
CREATE TABLE `aviso_economia` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`origen_tipo` text NOT NULL,
	`origen_id` text NOT NULL,
	`registrado_en` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `aviso_economia_tipo` ON `aviso_economia` (`tipo`);--> statement-breakpoint
CREATE TABLE `compra` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`importe_total` integer NOT NULL,
	`foto_ticket_ruta` text,
	`hucha_negativa_confirmada` integer NOT NULL,
	`registrada_en` text NOT NULL,
	`estado` text DEFAULT 'vigente' NOT NULL,
	`anulado_por` text,
	`anulado_en` text,
	`motivo_anulacion` text,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "compra_importe_valido" CHECK("compra"."importe_total" > 0),
	CONSTRAINT "compra_anulacion_valida" CHECK(("compra"."estado" = 'vigente' AND "compra"."anulado_por" IS NULL AND "compra"."anulado_en" IS NULL AND "compra"."motivo_anulacion" IS NULL)
			OR ("compra"."estado" = 'anulado' AND "compra"."anulado_por" IS NOT NULL AND "compra"."anulado_en" IS NOT NULL AND "compra"."motivo_anulacion" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `compra_cliente_id_unique` ON `compra` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `consumo` (
	`id` text PRIMARY KEY NOT NULL,
	`cliente_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`tipo_capsula_id` text NOT NULL,
	`invitado` integer NOT NULL,
	`precio_aplicado` integer NOT NULL,
	`coste_medio_aplicado` integer NOT NULL,
	`hora_gesto` text NOT NULL,
	`hora_registro` text NOT NULL,
	`estado` text DEFAULT 'vigente' NOT NULL,
	`anulado_por` text,
	`anulado_en` text,
	`motivo_anulacion` text,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "consumo_precio_valido" CHECK("consumo"."precio_aplicado" >= 0),
	CONSTRAINT "consumo_coste_valido" CHECK("consumo"."coste_medio_aplicado" >= 0),
	CONSTRAINT "consumo_anulacion_valida" CHECK(("consumo"."estado" = 'vigente' AND "consumo"."anulado_por" IS NULL AND "consumo"."anulado_en" IS NULL AND "consumo"."motivo_anulacion" IS NULL)
			OR ("consumo"."estado" = 'anulado' AND "consumo"."anulado_por" IS NOT NULL AND "consumo"."anulado_en" IS NOT NULL AND "consumo"."motivo_anulacion" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `consumo_cliente_id_unique` ON `consumo` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `consumo_tipo_hora` ON `consumo` (`tipo_capsula_id`,`hora_registro`);--> statement-breakpoint
CREATE TABLE `linea_compra` (
	`id` text PRIMARY KEY NOT NULL,
	`compra_id` text NOT NULL,
	`tipo_capsula_id` text NOT NULL,
	`cantidad` integer NOT NULL,
	`importe` integer NOT NULL,
	FOREIGN KEY (`compra_id`) REFERENCES `compra`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "linea_compra_cantidad_valida" CHECK("linea_compra"."cantidad" > 0),
	CONSTRAINT "linea_compra_importe_valido" CHECK("linea_compra"."importe" > 0)
);
--> statement-breakpoint
CREATE INDEX `linea_compra_tipo` ON `linea_compra` (`tipo_capsula_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `linea_compra_unica_por_tipo` ON `linea_compra` (`compra_id`,`tipo_capsula_id`);--> statement-breakpoint
CREATE TABLE `linea_recuento` (
	`id` text PRIMARY KEY NOT NULL,
	`recuento_id` text NOT NULL,
	`tipo_capsula_id` text NOT NULL,
	`registrado` integer NOT NULL,
	`contado` integer NOT NULL,
	`diferencia` integer NOT NULL,
	`coste_medio_aplicado` integer,
	`estado` text DEFAULT 'vigente' NOT NULL,
	`anulado_por` text,
	`anulado_en` text,
	`motivo_anulacion` text,
	FOREIGN KEY (`recuento_id`) REFERENCES `recuento`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulado_por`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "linea_recuento_contado_valido" CHECK("linea_recuento"."contado" >= 0),
	CONSTRAINT "linea_recuento_diferencia_coherente" CHECK("linea_recuento"."diferencia" = "linea_recuento"."contado" - "linea_recuento"."registrado"),
	CONSTRAINT "linea_recuento_anulacion_valida" CHECK(("linea_recuento"."estado" = 'vigente' AND "linea_recuento"."anulado_por" IS NULL AND "linea_recuento"."anulado_en" IS NULL AND "linea_recuento"."motivo_anulacion" IS NULL)
			OR ("linea_recuento"."estado" = 'anulado' AND "linea_recuento"."anulado_por" IS NOT NULL AND "linea_recuento"."anulado_en" IS NOT NULL AND "linea_recuento"."motivo_anulacion" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `linea_recuento_tipo_estado` ON `linea_recuento` (`tipo_capsula_id`,`estado`);--> statement-breakpoint
CREATE UNIQUE INDEX `linea_recuento_unica_por_tipo` ON `linea_recuento` (`recuento_id`,`tipo_capsula_id`);--> statement-breakpoint
CREATE TABLE `movimiento` (
	`id` text PRIMARY KEY NOT NULL,
	`cuenta` text NOT NULL,
	`usuario_id` text,
	`tipo` text NOT NULL,
	`importe` integer NOT NULL,
	`origen_tipo` text NOT NULL,
	`origen_id` text NOT NULL,
	`creado_en` text NOT NULL,
	`vigente` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "movimiento_importe_no_nulo" CHECK("movimiento"."importe" <> 0),
	CONSTRAINT "movimiento_cuenta_usuario" CHECK(("movimiento"."cuenta" = 'persona') = ("movimiento"."usuario_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `movimiento_usuario_vigente` ON `movimiento` (`usuario_id`,`vigente`);--> statement-breakpoint
CREATE INDEX `movimiento_cuenta_vigente` ON `movimiento` (`cuenta`,`vigente`);--> statement-breakpoint
CREATE INDEX `movimiento_origen` ON `movimiento` (`origen_tipo`,`origen_id`);--> statement-breakpoint
CREATE TABLE `recuento` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`realizado_en` text NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `regularizacion` (
	`id` text PRIMARY KEY NOT NULL,
	`compra_id` text NOT NULL,
	`consumo_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`importe` integer NOT NULL,
	`creada_en` text NOT NULL,
	FOREIGN KEY (`compra_id`) REFERENCES `compra`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`consumo_id`) REFERENCES `consumo`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuario`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "regularizacion_importe_no_nulo" CHECK("regularizacion"."importe" <> 0)
);
--> statement-breakpoint
CREATE INDEX `regularizacion_compra` ON `regularizacion` (`compra_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `regularizacion_una_por_consumo` ON `regularizacion` (`compra_id`,`consumo_id`);--> statement-breakpoint
CREATE TABLE `reparto` (
	`id` text PRIMARY KEY NOT NULL,
	`origen_tipo` text NOT NULL,
	`origen_id` text NOT NULL,
	`importe` integer NOT NULL,
	`miembros` integer NOT NULL,
	`creado_en` text NOT NULL,
	CONSTRAINT "reparto_importe_no_nulo" CHECK("reparto"."importe" <> 0),
	CONSTRAINT "reparto_miembros_positivos" CHECK("reparto"."miembros" > 0)
);
--> statement-breakpoint
CREATE INDEX `reparto_origen` ON `reparto` (`origen_id`);