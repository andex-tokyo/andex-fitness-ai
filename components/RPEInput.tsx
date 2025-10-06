"use client";

const RPE_DATA = [
  {
    value: 1,
    label: "非常に楽",
    rir: "9+回残し",
    color: "bg-green-100 border-green-300",
  },
  {
    value: 2,
    label: "楽",
    rir: "8回残し",
    color: "bg-green-100 border-green-300",
  },
  {
    value: 3,
    label: "やや楽",
    rir: "7回残し",
    color: "bg-green-200 border-green-400",
  },
  {
    value: 4,
    label: "少し楽",
    rir: "6回残し",
    color: "bg-green-200 border-green-400",
  },
  {
    value: 5,
    label: "普通",
    rir: "5回残し",
    color: "bg-yellow-100 border-yellow-400",
  },
  {
    value: 6,
    label: "ややきつい",
    rir: "4回残し",
    color: "bg-yellow-200 border-yellow-500",
  },
  {
    value: 7,
    label: "きつい",
    rir: "3回残し",
    color: "bg-orange-200 border-orange-400",
  },
  {
    value: 8,
    label: "かなりきつい",
    rir: "2回残し",
    color: "bg-orange-300 border-orange-500",
  },
  {
    value: 9,
    label: "非常にきつい",
    rir: "1回残し",
    color: "bg-red-300 border-red-500",
  },
  {
    value: 10,
    label: "限界",
    rir: "0回残し",
    color: "bg-red-400 border-red-600",
  },
];

interface RPEInputProps {
  value: number;
  onChange: (value: number) => void;
  quickChips?: number[];
}

export default function RPEInput({
  value,
  onChange,
  quickChips = [3, 5, 7, 8, 9],
}: RPEInputProps) {
  const currentRPE = RPE_DATA.find((r) => r.value === value) || RPE_DATA[6];

  return (
    <div className="space-y-4">
      <div
        className={`p-4 rounded-lg border-2 ${currentRPE.color} transition-all`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold">RPE {value}</span>
          <span className="text-sm font-medium">{currentRPE.rir}</span>
        </div>
        <p className="text-sm font-medium">{currentRPE.label}</p>
      </div>

      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        style={{
          background: `linear-gradient(to right, rgb(134 239 172) 0%, rgb(251 191 36) 50%, rgb(239 68 68) 100%)`,
        }}
      />

      <div className="flex gap-2 flex-wrap">
        {quickChips.map((chip) => (
          <button
            key={chip}
            onClick={() => onChange(chip)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              value === chip
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
