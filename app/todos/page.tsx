import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white border border-slate-border rounded-xl shadow-sm space-y-4">
      <h1 className="text-xl font-bold text-slate-text-primary tracking-tight">Supabase Todos Checklist</h1>
      {todos && todos.length > 0 ? (
        <ul className="divide-y divide-slate-border/50 text-sm font-semibold text-slate-text-secondary">
          {todos.map((todo) => (
            <li key={todo.id} className="py-2.5 flex items-center justify-between">
              <span>{todo.name}</span>
              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border ${
                todo.is_complete 
                  ? 'bg-emerald/5 text-emerald border-emerald/20' 
                  : 'bg-amber-500/5 text-amber-500 border-amber-500/20'
              }`}>
                {todo.is_complete ? 'Completed' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-text-muted">No todos found in your Supabase table. Try adding some records in your database!</p>
      )}
    </div>
  )
}
