import express, { Request, Response } from "express";
import { config } from "./config";
import {
  clerkMiddleware,
  clerkClient,
  requireAuth,
  getAuth,
} from "@clerk/express";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = config.PORT;

// Supabase setup
const supabaseUrl = config.SUPABASE_URL;
const supabaseKey = config.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(clerkMiddleware());

// Use requireAuth() to protect this route
// If user isn't authenticated, requireAuth() will redirect back to the homepage

app.get("/", (req, res) => {
  res.end("Server is Healthy");
});

app.get("/users", async (req: Request, res: Response): Promise<any> => {
  const { data, totalCount } = await clerkClient.users.getUserList({
    orderBy: "+created_at", 
  });
  const users = data?.map(user => ({
    id: user.id,
    username: user.username,
    email: user.emailAddresses[0].emailAddress,
    avatar: user.imageUrl
  }));
  res.json({ data:users, totalCount });
});

app.get(
  "/protected",
  requireAuth(),
  async (req: Request, res: Response): Promise<any> => {
    // Use `getAuth()` to get the user's `userId`
    const { userId } = getAuth(req);

    // Use Clerk's JavaScript Backend SDK to get the user's User object
    if (userId) {
      const user = await clerkClient.users.getUser(userId);
      return res.json({ user });
    }
    return res.end("sdsd");
  }
);

app.get(
  "/protected2",
  requireAuth({ signInUrl: config.CLERK_SIGN_IN_URL }),
  (req: Request, res: Response) => {
    res.send("This is a protected route.");
  }
);

// Example of a route that requires authentication and interacts with Supabase
app.get("/profile", async (req: Request, res: Response): Promise<any> => {
  // Get authenticated user from Clerk
  const { userId } = (req as any).auth?.userId;

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  // Query Supabase for user data using Clerk's user ID
  const { data, error } = await supabase
    .from("users") // Replace with your Supabase table name
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (error) {
    return res.status(500).send("Error fetching user data from Supabase");
  }

  return res.json({ user: data });
});

// Example route to handle user registration
app.post("/register", async (req: Request, res: Response): Promise<any> => {
  const { username, email, password } = req.body; // Ensure you handle request body parsing

  // Sign up the user with Clerk
  try {
    const clerkUser = await clerkClient.users.createUser({
      username: username,
      emailAddress: [email],
      password: password,
    });
    if (!clerkUser) {
      return res.status(404).send("Error");
    }
    const { error } = await supabase
      .from("users")
      .insert([{ clerk_user_id: clerkUser.id, email }]);

    if (error) {
      return res.status(500).send("Error inserting user data into Supabase");
    }
    res.status(201).send("User created successfully");
  } catch (err) {
    res.status(400).send(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
