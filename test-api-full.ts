import { getPublicTemplates, getFeaturedCreators } from './api';

async function test() {
  try {
    const templates = await getPublicTemplates(0, 6);
    console.log("Templates count:", templates.data.length);
    console.log("Templates error:", templates.error);
    if (templates.data.length > 0) {
      console.log("First template:", JSON.stringify(templates.data[0], null, 2));
    }
    
    const creators = await getFeaturedCreators();
    console.log("Creators count:", creators.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
