-- Catálogo real de perfumes "She She - Fáakihat Al-Ahlam" (línea Patty / Tu Aroma Me Enamora).
-- Las fotos viven en public/img/perfumes/ (sí se suben a git, a diferencia de
-- data/uploads/ que es solo para fotos que sube el panel de admin).
--
-- Ejecuta esto UNA VEZ contra la base de datos de producción para cargar
-- este catálogo, por ejemplo:
--   mysql -u tu_usuario -p tu_base < data/seed-perfumes.sql

USE dulzura_db;

INSERT INTO productos (nombre, categoria, precio, descripcion, imagen) VALUES
('She She Fáakihat Al-Ahlam SS021', 'perfume-mujer', '8000', 'Eau de Parfum 100ml, línea She She - Fáakihat Al-Ahlam (Ítem SS021). Aroma floral de larga duración.', '/img/perfumes/she-she-ss021.jpeg'),
('She She Fáakihat Al-Ahlam SS018', 'perfume-mujer', '8000', 'Eau de Parfum 100ml, línea She She - Fáakihat Al-Ahlam (Ítem SS018). Notas florales suaves.', '/img/perfumes/she-she-ss018.jpeg'),
('She She Fáakihat Al-Ahlam SS039', 'perfume-mujer', '8000', 'Eau de Parfum 100ml, línea She She - Fáakihat Al-Ahlam (Ítem SS039). Diseño luna y estrellas.', '/img/perfumes/she-she-ss039.jpeg'),
('She She Fáakihat Al-Ahlam SS010', 'perfume-mujer', '8000', 'Eau de Parfum 100ml, línea She She - Fáakihat Al-Ahlam (Ítem SS010). Frasco dorado, aroma intenso.', '/img/perfumes/she-she-ss010.jpeg'),
('She She Fáakihat Al-Ahlam SS030', 'perfume-mujer', '8000', 'Eau de Parfum 100ml, línea She She - Fáakihat Al-Ahlam (Ítem SS030). Frasco borgoña, aroma envolvente.', '/img/perfumes/she-she-ss030.jpeg'),
('She She Fáakihat Al-Ahlam SS015', 'perfume-mujer', '8000', 'Eau de Parfum 100ml, línea She She - Fáakihat Al-Ahlam (Ítem SS015). Frasco negro y rosado.', '/img/perfumes/she-she-ss015.jpeg'),
('Set Fáakihat Al-Ahlam para Hombre (3 pzs)', 'perfume-hombre', 'Consultar', 'Set de 3 fragancias Eau de Parfum de 50ml cada una, línea Fáakihat Al-Ahlam para hombre. Ideal para regalo.', '/img/perfumes/set-3pzs-hombre.jpeg');
