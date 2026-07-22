import FullCalendarWrapper from '../components/Calendar/FullCalendarWrapper';

export default function PlanningPage() {
  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Planning</h1>
      <div className="flex-1 min-h-0">
        <FullCalendarWrapper />
      </div>
    </div>
  );
}
