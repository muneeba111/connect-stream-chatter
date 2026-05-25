-- Make public chat actually public: allow anonymous browsing of rooms, messages, and profile display info
DROP POLICY IF EXISTS "Rooms readable by authenticated" ON public.rooms;
CREATE POLICY "Rooms readable by anyone" ON public.rooms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Messages readable by authenticated" ON public.messages;
CREATE POLICY "Messages readable by anyone" ON public.messages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by anyone" ON public.profiles FOR SELECT TO anon, authenticated USING (true);