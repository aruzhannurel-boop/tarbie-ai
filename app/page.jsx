
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY серверде табылмады." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = String(
      body.message ?? body.prompt ?? body.question ?? ""
    ).trim();

    if (!message) {
      return NextResponse.json(
        { error: "Сұрақ мәтінін енгізіңіз." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Сен ТӘРБИЕ AI атты қазақ тіліндегі педагогикалық көмекшісің. Тәрбие орынбасарына жоспарлар, идеялар, талдау және ұсыныстар дайында. Жауаптарың сауатты, құрылымды және пайдалы болсын."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);

      return NextResponse.json(
        {
          error: "OpenAI сұранысы орындалмады.",
          status: response.status
        },
        { status: 502 }
      );
    }

    const answer =
      data.choices?.[0]?.message?.content ??
      "Жауап алынбады.";

    return NextResponse.json({
      answer,
      result: answer,
      text: answer
    });
  } catch (error) {
    console.error("AI route error:", error.message);

    return NextResponse.json(
      { error: "Сервер қатесі. Қайта байқап көріңіз." },
      { status: 500 }
    );
  }
}
