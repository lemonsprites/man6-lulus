"use server";

export async function getData() {
  const res = await fetch(process.env.API_URL!, {
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
    cache: "no-store",
  });

  return res.json();
}