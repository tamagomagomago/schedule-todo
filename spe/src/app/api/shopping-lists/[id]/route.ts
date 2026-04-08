import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { is_completed } = await req.json();
    const { data, error } = await supabase
      .from("shopping_lists")
      .update({ is_completed, updated_at: new Date().toISOString() })
      .eq("id", parseInt(params.id))
      .select();

    if (error) throw error;
    return NextResponse.json({ item: data?.[0] });
  } catch (err) {
    console.error("Failed to update shopping list item:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", parseInt(params.id));

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete shopping list item:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
