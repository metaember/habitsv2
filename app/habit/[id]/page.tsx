// Habit detail page
export default function HabitDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Habit Detail</h1>
      <p>Habit ID: {params.id}</p>
      {/* Habit details and events will be displayed here */}
    </div>
  )
}