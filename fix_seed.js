const fs = require('fs');
let text = fs.readFileSync('supabase/seed.private.sql', 'utf8');
text = text.replace('category_id, description', 'category_id, brand_id, description');
text = text.replace(/'R1', 1, 'Ruta troncal/g, "'R1', 1, 1, 'Ruta troncal");
text = text.replace(/'R2', 2, 'Ruta circular/g, "'R2', 2, 2, 'Ruta circular");
fs.writeFileSync('supabase/seed.private.sql', text);
