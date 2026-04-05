import { createClient } from "@supabase/supabase-js";

type UserRow = {
  id: number;
  email: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  isPremium: boolean;
  credits: number;
  activeTripUntil: string | null;
  createdAt: string;
};

type ItineraryRow = {
  id: number;
  name: string;
  destination: string;
  theme: string | null;
  isCustom: boolean;
  userId: number;
  createdAt: string;
};

type DayRow = {
  id: number;
  dayNumber: number;
  itineraryId: number;
};

type StopRow = {
  id: number;
  time: string;
  title: string;
  description: string | null;
  dayId: number;
};

type SealRow = {
  id: number;
  name: string;
  icon: string;
  color: string;
  userId: number;
  createdAt: string;
};

type FavoriteRow = {
  id: number;
  localId: number;
  userId: number;
  createdAt: string;
};

type PostRow = {
  id: number;
  userId: number;
  local: string;
  texto: string;
  img: string;
  likes: number;
  createdAt: string;
};

type CommentRow = {
  id: number;
  text: string;
  userId: number;
  postId: number;
  createdAt: string;
};

type ProfileResponse = UserRow & {
  seals: SealRow[];
  favorites: FavoriteRow[];
  itineraries: Array<
    ItineraryRow & {
      days: Array<
        DayRow & {
          stops: StopRow[];
        }
      >;
    }
  >;
};

type PostResponse = PostRow & {
  user: UserRow | null;
  comments: Array<CommentRow & { user: UserRow | null }>;
};

let supabaseAdmin: any = null;

const MOCK_USER_ID = 1;
const MOCK_USER = {
  id: MOCK_USER_ID,
  email: "navegante@exemplo.com",
  name: "Capitao Navegante",
  bio: "Explorando os sete mares e as ruas de paralelepipedo.",
  avatar: "https://i.pravatar.cc/150?u=navegante",
  credits: 1,
};

const getSupabaseAdmin = (): any => {
  if (supabaseAdmin) return supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configuradas no servidor");
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return supabaseAdmin;
};

const getDb = () => getSupabaseAdmin().schema("navegantes");

const expectData = <T>(error: { message: string } | null, data: T | null, context: string): T => {
  if (error) {
    throw new Error(`[supabase:${context}] ${error.message}`);
  }
  if (data === null) {
    throw new Error(`[supabase:${context}] resposta vazia`);
  }
  return data;
};

const ensureMockUser = async () => {
  const supabase = getSupabaseAdmin();
  const db = getDb();
  const { data: existingUser, error } = await db
    .from("users")
    .select("*")
    .eq("id", MOCK_USER_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`[supabase:ensureMockUser.select] ${error.message}`);
  }

  if (existingUser) return existingUser;

  const { data: createdUser, error: createError } = await db
    .from("users")
    .insert(MOCK_USER)
    .select("*")
    .single();

  return expectData(createError, createdUser, "ensureMockUser.insert");
};

const getUsersByIds = async (ids: number[]) => {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return new Map<number, UserRow>();

  const db = getDb();
  const { data, error } = await db
    .from("users")
    .select("*")
    .in("id", uniqueIds);

  const users = expectData(error, data, "getUsersByIds");
  return new Map((users as UserRow[]).map((user) => [user.id, user]));
};

export const getProfile = async (): Promise<ProfileResponse> => {
  const db = getDb();
  const user = await ensureMockUser();

  const [{ data: seals, error: sealsError }, { data: favorites, error: favoritesError }, { data: itineraries, error: itinerariesError }] =
    await Promise.all([
      db.from("seals").select("*").eq("userId", user.id).order("createdAt", { ascending: false }),
      db.from("favorites").select("*").eq("userId", user.id).order("createdAt", { ascending: false }),
      db.from("itineraries").select("*").eq("userId", user.id).order("createdAt", { ascending: false }),
    ]);

  const itineraryRows = expectData(itinerariesError, itineraries, "getProfile.itineraries") as ItineraryRow[];
  const itineraryIds = itineraryRows.map((itinerary) => itinerary.id);

  let dayRows: DayRow[] = [];
  let stopRows: StopRow[] = [];

  if (itineraryIds.length > 0) {
    const { data: days, error: daysError } = await db
      .from("days")
      .select("*")
      .in("itineraryId", itineraryIds)
      .order("dayNumber", { ascending: true });

    dayRows = expectData(daysError, days, "getProfile.days") as DayRow[];

    const dayIds = dayRows.map((day) => day.id);
    if (dayIds.length > 0) {
      const { data: stops, error: stopsError } = await db
        .from("stops")
        .select("*")
        .in("dayId", dayIds)
        .order("time", { ascending: true });

      stopRows = expectData(stopsError, stops, "getProfile.stops") as StopRow[];
    }
  }

  const stopsByDayId = new Map<number, StopRow[]>();
  for (const stop of stopRows) {
    const list = stopsByDayId.get(stop.dayId) || [];
    list.push(stop);
    stopsByDayId.set(stop.dayId, list);
  }

  const daysByItineraryId = new Map<number, Array<DayRow & { stops: StopRow[] }>>();
  for (const day of dayRows) {
    const list = daysByItineraryId.get(day.itineraryId) || [];
    list.push({ ...day, stops: stopsByDayId.get(day.id) || [] });
    daysByItineraryId.set(day.itineraryId, list);
  }

  return {
    ...user,
    seals: expectData(sealsError, seals, "getProfile.seals") as SealRow[],
    favorites: expectData(favoritesError, favorites, "getProfile.favorites") as FavoriteRow[],
    itineraries: itineraryRows.map((itinerary) => ({
      ...itinerary,
      days: daysByItineraryId.get(itinerary.id) || [],
    })),
  };
};

export const updateProfile = async (input: { name?: string; bio?: string; avatar?: string }) => {
  const db = getDb();
  await ensureMockUser();

  const { data, error } = await db
    .from("users")
    .update({
      name: input.name,
      bio: input.bio,
      avatar: input.avatar,
    })
    .eq("id", MOCK_USER_ID)
    .select("*")
    .single();

  return expectData(error, data, "updateProfile");
};

export const upgradeProfile = async (input: { type?: string; days?: number }) => {
  const db = getDb();
  await ensureMockUser();

  const payload: Record<string, unknown> = {};
  if (input.type === "trip") {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (input.days || 15));
    payload.activeTripUntil = expirationDate.toISOString();
  } else if (input.type === "lifetime") {
    payload.isPremium = true;
  }

  const { data, error } = await db
    .from("users")
    .update(payload)
    .eq("id", MOCK_USER_ID)
    .select("*")
    .single();

  return expectData(error, data, "upgradeProfile");
};

export const getPosts = async (): Promise<PostResponse[]> => {
  const db = getDb();

  const { data: posts, error: postsError } = await db
    .from("posts")
    .select("*")
    .order("createdAt", { ascending: false });

  const postRows = expectData(postsError, posts, "getPosts.posts") as PostRow[];
  const postIds = postRows.map((post) => post.id);
  const postUserIds = postRows.map((post) => post.userId);

  let commentRows: CommentRow[] = [];
  if (postIds.length > 0) {
    const { data: comments, error: commentsError } = await db
      .from("comments")
      .select("*")
      .in("postId", postIds)
      .order("createdAt", { ascending: true });

    commentRows = expectData(commentsError, comments, "getPosts.comments") as CommentRow[];
  }

  const allUserIds = [...postUserIds, ...commentRows.map((comment) => comment.userId)];
  const usersById = await getUsersByIds(allUserIds);

  const commentsByPostId = new Map<number, Array<CommentRow & { user: UserRow | null }>>();
  for (const comment of commentRows) {
    const list = commentsByPostId.get(comment.postId) || [];
    list.push({ ...comment, user: usersById.get(comment.userId) || null });
    commentsByPostId.set(comment.postId, list);
  }

  return postRows.map((post) => ({
    ...post,
    user: usersById.get(post.userId) || null,
    comments: commentsByPostId.get(post.id) || [],
  }));
};

export const createPost = async (input: { local: string; texto: string; img: string }) => {
  const db = getDb();
  const user = await ensureMockUser();

  const { data, error } = await db
    .from("posts")
    .insert({
      userId: user.id,
      local: input.local,
      texto: input.texto,
      img: input.img,
    })
    .select("*")
    .single();

  const post = expectData(error, data, "createPost");
  return { ...post, user };
};

export const likePost = async (id: number) => {
  const db = getDb();
  const { data: existingPost, error: fetchError } = await db
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  const post = expectData(fetchError, existingPost, "likePost.fetch");

  const { data, error } = await db
    .from("posts")
    .update({ likes: post.likes + 1 })
    .eq("id", id)
    .select("*")
    .single();

  return expectData(error, data, "likePost.update");
};

export const createSeal = async (input: { name: string; icon: string; color: string }) => {
  const db = getDb();
  await ensureMockUser();

  const { data, error } = await db
    .from("seals")
    .insert({
      userId: MOCK_USER_ID,
      name: input.name,
      icon: input.icon,
      color: input.color,
    })
    .select("*")
    .single();

  return expectData(error, data, "createSeal");
};

export const addFavorite = async (localId: number) => {
  const db = getDb();
  await ensureMockUser();

  const { data, error } = await db
    .from("favorites")
    .upsert(
      {
        userId: MOCK_USER_ID,
        localId,
      },
      { onConflict: "userId,localId" },
    )
    .select("*")
    .single();

  return expectData(error, data, "addFavorite");
};

export const removeFavorite = async (localId: number) => {
  const db = getDb();
  await ensureMockUser();

  const { error } = await db
    .from("favorites")
    .delete()
    .eq("userId", MOCK_USER_ID)
    .eq("localId", localId);

  if (error) {
    throw new Error(`[supabase:removeFavorite] ${error.message}`);
  }
};

export const checkDatabaseHealth = async () => {
  const db = getDb();
  const { error } = await db.from("users").select("id").limit(1);
  if (error) {
    throw new Error(`[supabase:health] ${error.message}`);
  }
  return { ok: true };
};
