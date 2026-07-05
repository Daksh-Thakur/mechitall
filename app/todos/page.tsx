import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-border rounded-xl shadow-sm space-y-4">
      <h1 className="text-xl font-bold text-slate-text-primary">Supabase Database Test</h1>
      <p className="text-xs text-slate-text-muted">Fetching all rows from the `todos` table:</p>
      
      {todos && todos.length > 0 ? (
        <ul className="divide-y divide-slate-border text-xs font-semibold text-slate-text-secondary">
          {todos.map((todo) => (
            <li key={todo.id} className="py-2.5 flex items-center justify-between">
              <span>{todo.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald/10 text-emerald">Active</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-text-muted italic">No todos found in the database. Ensure a `todos` table exists and contains records.</p>
      )}
    </div>
  );
}
