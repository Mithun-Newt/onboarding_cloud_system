"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  data: { grade: string; registrations: number; admissions: number }[];
}

export function RegistrationsByGradeChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="registrations" name="Registrations" fill="#3b82f6" />
        <Bar dataKey="admissions" name="Admissions" fill="#22c55e" />
      </BarChart>
    </ResponsiveContainer>
  );
}
