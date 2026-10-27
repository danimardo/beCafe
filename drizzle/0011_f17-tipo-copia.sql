ALTER TABLE `copia_seguridad` ADD `tipo` text DEFAULT 'diaria' NOT NULL CONSTRAINT "copia_seguridad_tipo_valido" CHECK("tipo" IN ('diaria', 'manual'));
