import type { Event } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}

export default function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
          )}
          <div className="mt-3 space-y-1 text-sm text-gray-500">
            <p>
              <span className="font-medium">Início:</span>{" "}
              {formatDateTime(event.startDate)}
            </p>
            <p>
              <span className="font-medium">Fim:</span>{" "}
              {formatDateTime(event.endDate)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(event)}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
          >
            Editar
          </button>
          <button
            onClick={() => {
              onDelete(event.id);
            }}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Deletar
          </button>
        </div>
      </div>
    </div>
  );
}
