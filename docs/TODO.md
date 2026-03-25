DONE: fix if I login successfully the first to load is going to login page again after that it load to the home page. Not nice in user experience.

DONE: Same issue with registration it must redirect to home page after successful registration.

Follow programming principles and best practices.Make the code looks like it is coded by one person make it uniform and standardized.

Remove the 3 letters inside map bubbles whats the purpose of it? hence show emotions of the vent or you can represent emoticons on every emotions like you did in emotions color.

move all interface from every files into one folder, create enums folder for all enums, modularize the code.

backend should not be mixed with frontend;

if the user is inactive for 1 hour then the user must be logged out.

make sure all types are defined in typescript.

new: 

scan all files and fix errors

in maps vents has no color why?

emotions color must be complete based the emotions list on the vent form. make sure all has assigned colors and emoticons

example this

chat page:

must show axios request and response in the console.
messages/api/messages/

and the backend logic must be separate and it must not mix on ui.

const { data, error } = await (supabase.from("messages") as any)
      .select("*, profiles (username, avatar_url)")
      .is("group_id", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + MESSAGES_PER_PAGE - 1);

apply in all pages

