-- Neo Mercado - Productos REALES del Catálogo
-- Estos son los 337 productos del catálogo actual en Vercel

-- TRUNCATE (limpiar tabla si existe)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;

-- HARINAS (11 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Harina PUREZA 0000 kilo','Harina de trigo 0000 ultra refinada, bolsa 1kg','Harinas',1250,1089,10,100,FALSE),
('Harina PUREZA leudante kilo','Harina leudante ultra refinada para repostería casera, bolsa 1kg','Harinas',1665,1525,10,100,FALSE),
('Harina PUREZA pizza kilo','Harina especial para pizzas caseras, con levadura, bolsa 1kg','Harinas',1915,1755,10,100,FALSE),
('Harina MORIXE 000 kilo','Harina de trigo 000 Fortivac, con vitamina B6 y zinc, bolsa 1kg','Harinas',809,739,10,100,FALSE),
('Harina CAÑUELAS 000 kilo','Harina de trigo 000 ultra refinada, para todos los usos, bolsa 1kg','Harinas',989,905,10,100,FALSE),
('Harina BLANCAFLOR leudante kilo','Harina leudante La Original, ideal para repostería, bolsa 1kg','Harinas',1755,1609,15,100,FALSE),
('Polenta PRESTO PRONTA 490g','Polenta instantánea, rinde 8 platos, paquete 490g','Harinas',1260,1155,30,100,FALSE),
('Harina CHACABUCO 000 kg','Harina de trigo 000, ideal para pastas, bolsa 1kg','Harinas',1047,959,10,100,FALSE),
('Harina CHACABUCO 0000 kg','Harina de trigo 0000, bolsa 1kg','Harinas',1339,1225,10,100,FALSE),
('Harina CHACABUCO leudante kg','Harina leudante, bolsa 1kg','Harinas',1629,1490,10,100,FALSE),
('Harina CHACABUCO integral kg','Harina integral, bolsa 1kg','Harinas',1519,1389,10,100,FALSE);

-- FIDEOS (10 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Fideos SOL PAMPEANO 500g','Tallarín o Spaghetti, fideos secos','Fideos',910,790,20,100,FALSE),
('Fideos SOL PAMPEANO 500g variedad','Surtido: Codo, Celentano, Ave María, Rigatti, Dedal, Dedalito, Mostachol o Tirabuzón','Fideos',910,790,15,100,FALSE),
('Fideos SOL PAMPEANO moños 500g','Moños, fideos secos','Fideos',1325,1150,15,100,FALSE),
('Fideos SOL PAMPEANO 3 vegetales 500g','Tirabuzón o Mostachol con vegetales (zanahoria y espinaca)','Fideos',1275,1169,15,100,FALSE),
('Lasagna SOL PAMPEANO 200g','Pasta seca precocida para lasaña','Fideos',1179,1060,12,100,FALSE),
('Ramén ARCOR 70g','Sabor Pollo, Pollo Picante o Carne','Fideos',1515,1395,24,100,FALSE),
('Fideos FAVORITA 500g','Spaghetti o Mostachol','Fideos',779,715,15,100,FALSE),
('Fideos LUCCHETTI 500g','Tallarín, Spaghetti o Forattini','Fideos',1229,1125,20,100,FALSE),
('Fideos LUCCHETTI 500g variedad','Surtido: Codito, Penne Rigate, Mostachol, Tirabuzón, Letrita, Ave María o Dedalitos','Fideos',1229,1125,15,100,FALSE),
('Fideos LUCCHETTI cabello de ángel 500g','Cabello de ángel, fideos secos','Fideos',2465,2255,15,100,FALSE);

-- ARROCES (8 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Arroz GALLO l/f 500g','Arroz largo fino Gallo, todo uso','Arroces',1145,1049,10,100,FALSE),
('Arroz GALLO oro 500g','Arroz Gallo Oro Selección, premium','Arroces',999,915,10,100,FALSE),
('Arroz GALLO preparado 240g','Sabor queso, vegetales o verdeo, listo en 15 minutos','Arroces',2485,2275,12,100,FALSE),
('Arroz LUCCHETTI l/f 500g','Arroz largo fino, todo tipo de platos','Arroces',965,880,10,100,FALSE),
('Arroz CAÑUELAS l/f 500g','Arroz largo fino, para todos los usos','Arroces',799,715,12,100,FALSE),
('Arroz LUCCHETTI l/f kilo','Arroz largo fino, todo tipo de platos, bolsa 1kg','Arroces',1869,1709,10,100,FALSE),
('Arroz LUCCHETTI parboil 500g','Arroz parboil, no se pasa ni se pega','Arroces',1055,965,10,100,FALSE),
('Arroz CAÑUELAS l/f kilo','Arroz largo fino, para todos los usos, bolsa 1kg','Arroces',1315,1199,10,100,FALSE);

-- SALSAS (7 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Puré de tomate OKEY 520g','Puré de tomate clásico','Salsas',715,655,24,100,FALSE),
('Puré de tomate MOLTO 520g','Libre de gluten, elaborado con kilos de tomate fresco','Salsas',959,879,24,100,FALSE),
('Puré de tomate DE LA HUERTA 520g','Puré de tomate rehidratado, marca Baggio','Salsas',925,845,12,100,FALSE),
('Puré de tomate ARCOR 520g','Puré de tomate','Salsas',899,790,12,100,FALSE),
('Tomate ARCOR perita 400g','Tomates perita en lata, sin conservantes','Salsas',1350,1239,24,100,FALSE),
('Tomate OLIVARES DEL CESAR triturado 950g','Tomate triturado en botella','Salsas',1809,1655,8,100,FALSE),
('Salsa lista ARCOR pomarola 340g','Sabor filetto o pizza, lista para usar','Salsas',1089,1089,24,100,FALSE);

-- ACEITES (12 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Aceite OKEY mezcla 900cc','Aceite mezcla','Aceites',2519,2229,12,100,TRUE),
('Aceite COCINERO mezcla 900cc','Aceite mezcla','Aceites',3250,2975,15,100,TRUE),
('Aceite SOLEMNE mezcla 900cc','Aceite mezcla','Aceites',2649,2465,12,100,TRUE),
('Aceite PAISANO girasol 900cc','Aceite de girasol','Aceites',2685,2499,12,100,TRUE),
('Aceite CAÑUELAS girasol 900cc','Aceite de girasol, con vitamina E','Aceites',3770,3450,12,100,TRUE),
('Aceite COCINERO girasol 900cc','Aceite de girasol','Aceites',3855,3529,15,100,TRUE),
('Aceite NATURA girasol 900cc','Aceite de girasol, 900ml','Aceites',4665,4265,15,100,TRUE),
('Aceite LEGITIMO girasol 900cc','Aceite de girasol','Aceites',3835,3509,12,100,TRUE),
('Aceite CAÑUELAS girasol 1.5lt','Aceite de girasol, botella 1,5 litros','Aceites',6409,5869,12,100,TRUE),
('Aceite COCINERO girasol 1.5lt','Aceite de girasol, botella 1,5 litros','Aceites',5850,5265,12,100,TRUE),
('Aceite NATURA girasol 1.5lt','Aceite de girasol, botella 1,5 litros','Aceites',6500,5950,12,100,TRUE),
('Aceite GERASOLES girasol bidón 4.5lt','Aceite de girasol, bidón 4,5 litros','Aceites',11440,10475,4,100,TRUE);

-- ADEREZOS (12 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Mayonesa HELLMANNS clásica 237g','Mayonesa clásica, doypack','Aderezos',1481,1355,24,100,FALSE),
('Mayonesa HELLMANNS clásica 475g','Mayonesa clásica, doypack','Aderezos',2589,2369,15,100,FALSE),
('Mostaza NATURA 250g','Mostaza equilibrada, intensa y especiada','Aderezos',1125,1119,12,100,FALSE),
('Ketchup NATURA 250g','Ketchup','Aderezos',1819,1665,12,100,FALSE),
('Mayonesa NATURA 125g','Mayonesa, doypack chico','Aderezos',650,595,20,100,FALSE),
('Mayonesa NATURA 250g','Mayonesa, doypack','Aderezos',1589,1455,12,100,FALSE),
('Mayonesa NATURA 500g','Mayonesa, doypack','Aderezos',3280,2999,12,100,FALSE),
('Mayonesa NATURA kg','Mayonesa, doypack 1kg','Aderezos',5909,5409,8,100,FALSE),
('Mayonesa NATURA 2.9kg','Mayonesa, bolsa 2,9kg, formato granel','Aderezos',13695,11905,4,100,FALSE),
('Mayonesa CADA DIA 250g','Mayonesa, familia de sabores','Aderezos',869,799,12,100,FALSE),
('Mayonesa CADA DIA 500g','Mayonesa, familia de sabores','Aderezos',1675,1535,12,100,FALSE),
('Mayonesa CADA DIA kg','Mayonesa, familia de sabores, 1kg','Aderezos',3249,2975,8,100,FALSE);

-- CONSERVAS (11 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Paté/Picadillo SWIFT 90g','Paté de foie o picadillo de carne, lata','Conservas',1035,949,24,100,FALSE),
('Paté CHANGUITO 90g','Paté de foie, lata','Conservas',789,719,24,100,FALSE),
('Choclo OKEY amarillo 280g','Choclo amarillo en grano, lata','Conservas',1469,1289,24,100,FALSE),
('Choclo INALPA amarillo 300g','Choclo amarillo, listo para servir','Conservas',1629,1490,24,100,FALSE),
('Choclo MONTE NEVI amarillo 300g','Choclo amarillo entero','Conservas',1139,1045,24,100,FALSE),
('Atún BAHIA desmenuzado 170g','Al natural o en aceite','Conservas',1469,1345,48,100,FALSE),
('Atún BAHIA lomitos 170g','Al natural o en aceite','Conservas',2999,2749,48,100,FALSE),
('Atún CUMANA desmenuzado 170g','Al natural o en aceite','Conservas',1439,1315,48,100,FALSE),
('Porotos INALPA 300g','Porotos secos remojados, listos para servir','Conservas',829,759,24,100,FALSE),
('Arvejas INALPA 300g','Arvejas secas remojadas, listas para servir','Conservas',740,610,24,100,FALSE),
('Arvejas MOLTO tetra 340g','Arvejas, envase tetra','Conservas',669,610,24,100,FALSE);

-- ALMACÉN (13 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Vinagre SILVA litro','Vinagre de alcohol','Almacén',935,855,8,100,FALSE),
('Vinagre SILVA bidón 5 litros','Vinagre de alcohol gourmet, bidón','Almacén',4035,3690,2,100,FALSE),
('Jugo limón SILVA litro','Jugo de limón','Almacén',1939,1775,8,100,FALSE),
('Sal Fina CELUSAL paquete 500g','Sal fina de mesa','Almacén',1000,919,30,100,FALSE),
('Sal fina DOS ESTRELLAS 500g','Sal fina lavada y purificada','Almacén',590,535,24,100,FALSE),
('Sal Gruesa DOS ESTRELLAS kilo','Sal gruesa lavada y purificada, bolsa 1kg','Almacén',1045,955,10,100,FALSE),
('Sal fina TRESAL 500g','Sal fina','Almacén',589,530,20,100,FALSE),
('Sal Gruesa TRESAL kilo','Sal gruesa, bolsa 1kg','Almacén',1140,1029,10,100,FALSE),
('Caldo KNORR verduras x6 cub','Caldo deshidratado de verduras, sin conservantes','Almacén',1229,1229,10,100,FALSE),
('Caldo KNORR verduras x12 cub','Caldo deshidratado de verduras, caja x12','Almacén',2275,2275,1,100,FALSE),
('Sopa KNORR Quick','Sabor zapallo, choclo o vegetales, estuche de 5 sobres','Almacén',2715,2715,1,100,FALSE),
('Sopa KNORR crema vegetales 60g','Sopa crema de vegetales','Almacén',2045,2045,1,100,FALSE),
('Caldo MOLTO verduras x12 cub','Caldo de verdura deshidratado, 12 unidades','Almacén',1425,1425,1,100,FALSE);

-- DESAYUNO (15 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Cacao NESQUIK 180g','Cacao en polvo, con cacao de origen responsable','Desayuno',1915,1665,18,100,FALSE),
('Cacao NESQUIK 360g','Cacao en polvo','Desayuno',4745,4350,12,100,FALSE),
('Bizcochuelo EXQUISITA vainilla 540g','Premezcla para bizcochuelo sabor vainilla','Desayuno',2449,2239,12,100,FALSE),
('Chocolate ALTEZA taza 90g','Chocolate para taza, en barra','Desayuno',1975,1805,50,100,FALSE),
('Mermelada NOEL 454g','Naranja, durazno, damasco o ciruela','Desayuno',2285,2089,12,100,FALSE),
('Mermelada NOEL light 454g','Ciruela o damasco','Desayuno',2415,2170,12,100,FALSE),
('Malta EL POCILLO dp 115g','Malta instantánea, doypack, pack oferta','Desayuno',1899,1739,12,100,FALSE),
('Malta EL POCILLO 170g','Malta instantánea, frasco','Desayuno',2999,2745,6,100,FALSE),
('Té TARAGUI 25 saq.','Té en saquitos','Desayuno',835,760,10,100,FALSE),
('Azúcar LA CAMPECHANA kilo','Azúcar común tipo A, bolsa 1kg','Desayuno',1430,1249,10,100,FALSE),
('Azúcar LEDESMA kilo','Azúcar pura caña clásica, bolsa 1kg','Desayuno',1549,1419,10,100,FALSE),
('Café VIRGINIA 20s','Café torrado equilibrado en saquitos','Desayuno',5379,4925,10,100,FALSE),
('Café VIRGINIA 50g','Café instantáneo, clásico o suave','Desayuno',3299,3020,6,100,FALSE),
('Café VIRGINIA 170g','Café instantáneo, clásico o suave','Desayuno',8689,7950,6,100,FALSE),
('Cappuccino VIRGINIA 10s','Cappuccino tradicional, 10 sobres','Desayuno',5379,4925,6,100,FALSE);

-- YERBA E INFUSIONES (11 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Yerba MAROLIO 500g','Yerba mate tradicional','Yerba e Infusiones',1489,1359,10,100,FALSE),
('Yerba CBSé 500g','Pomelo, limón, naranja, hierbas serranas o frutos del bosque','Yerba e Infusiones',1790,1639,12,100,FALSE),
('Yerba TRANQUERA liviana 500g','Yerba mate liviana','Yerba e Infusiones',1485,1339,12,100,FALSE),
('Yerba AMANDA 500g','Yerba mate tradicional, elaborada con palo','Yerba e Infusiones',1719,1495,10,100,FALSE),
('Yerba ANDRESITO 500g','Yerba mate elaborada con palo','Yerba e Infusiones',1589,1375,10,100,FALSE),
('Yerba MAÑANITA 500g','Yerba mate compuesta','Yerba e Infusiones',2055,1879,10,100,FALSE),
('Yerba PLAYADITO 500g','Yerba mate suave, elaborada con palo','Yerba e Infusiones',2430,2115,10,100,FALSE),
('Yerba AMANDA kilo','Yerba mate tradicional, bolsa 1kg','Yerba e Infusiones',3389,3100,10,100,FALSE),
('Yerba ANDRESITO kilo','Yerba mate elaborada con palo, bolsa 1kg','Yerba e Infusiones',3159,2890,10,100,FALSE),
('Yerba MAÑANITA kilo','Yerba mate compuesta, bolsa 1kg','Yerba e Infusiones',3510,3215,10,100,FALSE),
('Yerba PLAYADITO kilo','Yerba mate suave, bolsa 1kg','Yerba e Infusiones',4545,4159,5,100,FALSE);

-- LÁCTEOS (12 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Dulce de leche GRANJA DE ORO 200g','Pote de dulce de leche','Lácteos',1095,1000,24,100,FALSE),
('Dulce de leche GRANJA DE ORO 400g','Pote de dulce de leche','Lácteos',2190,2000,12,100,FALSE),
('Dulce de leche ILOLAY 200g','Dulce de leche clásico','Lácteos',1780,1629,24,100,FALSE),
('Dulce de leche ILOLAY 400g','Clásico o repostero','Lácteos',3185,2919,12,100,FALSE),
('Queso LA QUESERA caja 20 sobres 40g','Queso rallado, caja de 20 sobres','Lácteos',13750,13750,20,100,FALSE),
('Leche BAGGIO tetra lt','Leche UHT entera','Lácteos',2210,2025,8,100,FALSE),
('Leche MANFREY tetra lt','Leche entera','Lácteos',1950,1790,12,100,FALSE),
('Leche YATASTO tetra lt','Entera o descremada','Lácteos',1999,1830,12,100,FALSE),
('Leche SERENISIMA 3% tetra lt','Leche larga vida','Lácteos',2770,2539,12,100,FALSE),
('Leche SERENISIMA 1% tetra lt','Leche larga vida liviana','Lácteos',2770,2539,12,100,FALSE),
('Leche SERENISIMA 0 lactosa litro','Leche zero lactosa','Lácteos',2935,2685,6,100,FALSE),
('Leche SERENISIMA proteica litro','Leche descremada, 46g de proteína','Lácteos',2935,2685,6,100,FALSE);

-- GALLETITAS (32 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('PROVIDENCIA tripack','Galletitas dulces, pack x3','Galletitas',1390,1269,16,100,FALSE),
('MEDIATARDE tripack','Galletitas clásicas, oferta pack x3','Galletitas',1625,1489,14,100,FALSE),
('Crackers PASEO 300g','Clásica o sin sal, con masa madre','Galletitas',1159,1059,14,100,FALSE),
('Crackers PASEO variedades 300g','Multicereal, sésamo, queso o pizza','Galletitas',1450,1329,14,100,FALSE),
('Bizcochos 9 DE ORO 200g','Clásicos, agridulce, azucarados, light o salvado','Galletitas',1139,1040,20,100,FALSE),
('Bizcochos DON SATUR 200g','Salados, agridulce o negritos','Galletitas',1190,1029,30,100,FALSE),
('Tostadas RIERA 200g','Clásica, sin sal o dulce','Galletitas',1429,1305,18,100,FALSE),
('Marineras CAMET 330g','Con sal','Galletitas',1909,1745,8,100,FALSE),
('Tostadas MANIERI 200g','Clásica, dulce, salvado o salvado sin sal','Galletitas',1115,1025,12,100,FALSE),
('Tostadas MANIERI arroz 120g','Tostadas de arroz, más livianas','Galletitas',1430,1309,12,100,FALSE),
('Pepas SOL DE COCO 330g','Galletitas dulces bañadas','Galletitas',2969,2719,12,100,FALSE),
('Pepas CHOC bañadas 200g','Galletitas bañadas en chocolate','Galletitas',3045,2785,24,100,FALSE),
('Oblea ZUPAY 100g','Vainilla, frutilla, chocolate, limón, dulce de leche o banana','Galletitas',775,709,30,100,FALSE),
('HOJALMAR 150g','Larguitas o triangulitos','Galletitas',1495,1365,18,100,FALSE),
('Cintitas TOSTEX 125g','Clásicas, queso, cebolla, oliva, ketchup, semillas, salame o jamón','Galletitas',1039,930,13,100,FALSE),
('Cintitas TOSTEX bañadas 88g','Frutilla, chocolate o crema','Galletitas',1359,1249,15,100,FALSE),
('Palmeritas SARAVA 200g','Palmeritas mini','Galletitas',1560,1429,16,100,FALSE),
('Pepas TEREPIN 200g','Rellenas de membrillo','Galletitas',845,779,24,100,FALSE),
('Cañoncitos KOKIS 200g','Masitas rellenas con mermelada de membrillo','Galletitas',1345,1229,18,100,FALSE),
('Vanina FORVAN 160g','Galletitas rellenas','Galletitas',900,825,20,100,FALSE),
('Surtidas DIVERSION 400g','Surtido de galletitas dulces','Galletitas',2449,2239,21,100,FALSE),
('Surtidas BAGLEY 400g','Surtido 160 años, con Rumba, Chocolinas y Sonrisas','Galletitas',2915,2669,21,100,FALSE),
('Surtidas VARIEDAD Terrabusi 390g','Anillos, Duquesa, Mini Lincoln y más','Galletitas',2579,2359,20,100,FALSE),
('Surtidas SOLITAS 300g','Surtido de galletitas dulces','Galletitas',1335,1239,14,100,FALSE),
('COFLER 85g','Rellenas, sabor chocolate, creamy o bon o bon','Galletitas',1130,1035,27,100,FALSE),
('OREO 118g','Clásica o chocolate','Galletitas',1795,1645,36,100,FALSE),
('TRIO 300/350g','Pepas, pepas alemanas, trichoc, tartelette y más variedades','Galletitas',1505,1379,10,100,FALSE),
('SONRISAS 108g','Sabor frambuesa','Galletitas',1350,1239,36,100,FALSE),
('CHOCOLINAS 170g','Galletitas de chocolate original','Galletitas',1549,1419,40,100,FALSE),
('MACUCAS 110g','Sabor chocolate','Galletitas',1019,935,36,100,FALSE),
('PORTEÑITAS 139g','Originales','Galletitas',1255,1129,36,100,FALSE),
('MERENGADAS 88g','Rellenas de merengue','Galletitas',1389,1275,36,100,FALSE);

-- GOLOSINAS (34 productos) - Parte 1
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Alfajor HAMLET 34g','Alfajor bañado en chocolate','Golosinas',439,399,40,100,FALSE),
('Alfajor RASTA 70g','Sabor a bajón, negro o blanco','Golosinas',1279,1169,18,100,FALSE),
('Alfajor PESCADO RAUL 50g','Alfajor triple negro, sabor vainilla','Golosinas',750,689,12,100,FALSE),
('Alfajor GUAYMALLEN 70g','Alfajor de dulce de leche','Golosinas',530,460,24,100,FALSE),
('Bizcochuelo PICNIC 38g','Barrita bizcochuelo bañada','Golosinas',405,369,40,100,FALSE),
('Minitorta RAPSODIA 80g','Mini torta rellena, bañada en chocolate','Golosinas',699,645,24,100,FALSE),
('Alfajor FANTOCHE triple 100g','Red velvet o super triple','Golosinas',1079,999,12,100,FALSE),
('Confites ROCKLETS caja 24u x 20g','Original o mundial, caja de 24 unidades','Golosinas',19585,19585,1,100,FALSE),
('Oblea TITA caja 36u x 19g','Caja de 36 unidades','Golosinas',29880,29880,1,100,FALSE),
('Chocolate MISKY caja 30u x 25g','Chocolate con leche, blanco o negro, caja de 30 unidades','Golosinas',27690,27690,1,100,FALSE),
('Oblea RHODESIA caja 36u x 22g','Caja de 36 unidades','Golosinas',32868,32868,1,100,FALSE),
('Chocolate SHOT 90g','Chocolate con maní','Golosinas',4479,4100,16,100,FALSE),
('Chocolate CADBURY frutillas caja 12x29g','Yoghurt frutilla, caja de 12 unidades','Golosinas',23160,23160,1,100,FALSE),
('Malvaviscos GONGYS 28g','Frutilla, nubecita o trenza','Golosinas',429,390,48,100,FALSE),
('Gomitas YUMMY caja 12u x 30g','Fruti c/crema, piecitos ácidos o eucaliptus, caja de 12 unidades','Golosinas',6972,6972,1,100,FALSE),
('Gomitas TEMBLEKE 6u','Dino, tropical, bichos, gol, pirata o frutas','Golosinas',1149,1035,60,100,FALSE),
('Chupetín CHUPETONCITO caja 8u x 35g','Caja de 8 unidades','Golosinas',5195,5195,1,100,FALSE),
('Barra CEREAL FORT caja 24u x 20g','Varios sabores, caja de 24 unidades','Golosinas',13600,13600,1,100,FALSE),
('Chupetin CRAZY POP caja 10u x 12g','Frutilla, naranja, uva o sandía, caja de 10 unidades','Golosinas',5645,5645,1,100,FALSE),
('Chupetín MR. POPS c/chicle 432g','Blueberry, cereza, extreme duo, fresh o surtido','Golosinas',5675,5675,1,100,FALSE),
('Chocolate DOS CORAZONES caja 20u x 26g','Caja de 20 unidades','Golosinas',23800,23800,1,100,FALSE),
('Bocadito MARROC caja 60u x 14g','Caja de 60 unidades','Golosinas',40020,40020,1,100,FALSE),
('Chicle BELDENT caja 20un x10g','Amarillo, negro, rosa, verde, azul o rojo, caja de 20 unidades','Golosinas',16000,16000,1,100,FALSE),
('Pastilla MENTHOPLUS caja 12un x29g','Menta, mentol, strong, miel o cherry, caja de 12 unidades','Golosinas',7719,7719,1,100,FALSE),
('Pastillas HALLS caja 12u x26g','Sandía, mentaliptus, mentol, cherry, miel y limón, strong o miel con menta, caja de 12 unidades','Golosinas',9075,9075,1,100,FALSE),
('Pastillas FULL MINT caja 12u x28g','Cherry, menta, miel o menta fuerte, caja de 12 unidades','Golosinas',4870,4870,1,100,FALSE),
('Gomitas MISKY kg','Eucalipto, jelly roll o fantasía','Golosinas',10399,10399,1,100,FALSE),
('Caramelos MISKY masticables 800g','Surtidos','Golosinas',6329,6329,1,100,FALSE),
('Caramelos PALITOS DE LA SELVA 660g','Caramelos masticables','Golosinas',9179,9179,1,100,FALSE),
('Caramelos BUTTER TOFFEES 820g','Dulce de leche caramel','Golosinas',12699,12699,1,100,FALSE),
('Caramelos FLYNN PAFF caja 70u','Banana-frutilla, lima+frambuesa o durazno-vainilla, caja de 70 unidades','Golosinas',6995,6995,1,100,FALSE),
('Turrón MISKY 25g','Turrón y maní','Golosinas',250,219,50,100,FALSE),
('Turrón ARCOR 25g','Turrón y maní','Golosinas',299,275,50,100,FALSE),
('Caramelos SUGUS confitados 50g','Confitados','Golosinas',1115,1089,30,100,FALSE);

-- IMPULSO (6 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Preservativo MAXX unidad','Doble placer, super lubricado, super fino, mega, ultra fino o tachas','Impulso',1625,1489,12,100,FALSE),
('Pilas ENERGIZER AA','Pilas alcalinas','Impulso',1225,1065,10,100,FALSE),
('Pilas ENERGIZER AAA','Pilas alcalinas','Impulso',1225,1065,10,100,FALSE),
('Encendedor BIC mini x12 uni.','Caja de 12 unidades','Impulso',12325,12325,1,100,FALSE),
('Encendedor OKEY caja 25 uni.','Caja de 25 unidades','Impulso',6350,6350,1,100,FALSE),
('Resma PAMPA A4 70g 500h','Papel blanco alcalino','Impulso',7010,6309,10,100,FALSE);

-- SNACKS (8 productos)
INSERT INTO products (nombre, descripcion, categoria, precio_unitario, precio_bulto, factor_bulto, stock, permite_ajuste_precio) VALUES
('Bastonitos KRACHITOS 300g','Snack de maíz','Snacks',4049,4049,6,100,FALSE),
('Galletitas SALADIX 100g','Jamón, pizza, duo, calabresa o picante','Snacks',1625,1489,6,100,FALSE),
('Papas BULNEZ 100g','Original, cebolla o cheddar, tubo','Snacks',2455,2455,24,100,FALSE),
('Galletitas KESITAS/REX 125g','Surtido de galletitas saladas','Snacks',1655,1655,1,100,FALSE),
('Papas KRACHITOS 420g','Tradicional (azul) o americano (roja)','Snacks',6229,6069,7,100,FALSE),
('Papas PEHUAMAR 450g','Tradicional o acanaladas','Snacks',7789,7129,9,100,FALSE),
('Maicitos PEHUAMAR 265g','Snack de maíz','Snacks',5059,4629,10,100,FALSE),
('Palitos PEHUAMAR salados 620g','Palitos salados','Snacks',6665,6665,6,100,FALSE);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
