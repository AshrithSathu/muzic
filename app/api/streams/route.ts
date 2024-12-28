import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { title } from "process";

//@ts-ignore
import youtubesearchapi from "youtube-search-api";
import z from "zod";

enum StreamType {
  Youtube = "Youtube",
  Spotify = "Spotify",
}

const Youtube_regex = new RegExp(
  "^(?:https?://)?(?:www.)?youtube.com/watch\\?v=([a-zA-Z0-9_-]{11})"
);

const Spotify_regex = new RegExp(
  "^(?:https?://)?(?:open\\.)?spotify\\.com/track/([a-zA-Z0-9]{22})"
);

const createStreamSchema = z.object({
  createrId: z.string(),
  url: z.string().refine((url) => {
    return (
      url.includes("https://www.youtube.com/watch?v=") ||
      url.includes("https://open.spotify.com/track/")
    );
  }, "URL must be from YouTube or Spotify"),
});

export async function POST(req: NextRequest) {
  try {
    const { createrId, url } = createStreamSchema.parse(await req.json());

    let type = null;
    let extractedId = null;
    let YTtitle = null;
    let YTthumbnail = null;

    if (Youtube_regex.test(url)) {
      type = StreamType.Youtube;

      extractedId = url.match(Youtube_regex)?.[1];

      const data = await youtubesearchapi.GetVideoDetails(extractedId);
      YTtitle = data.title;
      YTthumbnail = data.thumbnail.thumbnails;
      YTthumbnail.sort((a: { width: number }, b: { width: number }) =>
        a.width < b.width ? 1 : -1
      );

      console.log(data.title);
      // console.log(data.thumbnail.thumbnails);

      console.log(extractedId + "extractedId from youtube");
    } else if (Spotify_regex.test(url)) {
      type = StreamType.Spotify;

      extractedId = url.match(Spotify_regex)?.[1];
      console.log(extractedId + "extractedId from spotify");
    }

    if (!type || !extractedId) {
      return NextResponse.json(
        { error: "Invalid URL, please provide a valid YouTube or Spotify URL" },
        { status: 411 }
      );
    }

    const stream = await prismaClient.stream.create({
      data: {
        userId: createrId,
        url: url,
        type: type,
        extractedId: extractedId,
        title: YTtitle ?? "Cant fetch title",
        smallImage:
          (YTthumbnail.length > 1
            ? YTthumbnail[YTthumbnail.length - 2].url
            : YTthumbnail[YTthumbnail.length - 1].url) ??
          "https://cdn.vox-cdn.com/thumbor/WR9hE8wvdM4hfHysXitls9_bCZI=/0x0:1192x795/1400x1400/filters:focal(596x398:597x399)/cdn.vox-cdn.com/uploads/chorus_asset/file/22312759/rickroll_4k.jpg",
        largeImage:
          YTthumbnail[YTthumbnail.length - 1].url ??
          "https://cdn.vox-cdn.com/thumbor/WR9hE8wvdM4hfHysXitls9_bCZI=/0x0:1192x795/1400x1400/filters:focal(596x398:597x399)/cdn.vox-cdn.com/uploads/chorus_asset/file/22312759/rickroll_4k.jpg",
      },
    });

    return NextResponse.json({
      message: "Stream added successfully!",
      id: stream.id,
    });
  } catch (error) {
    console.error("Error while adding stream:", error);
    return NextResponse.json(
      { error: "Error while adding stream" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const createrId = req.nextUrl.searchParams.get("createrId");
  const streams = await prismaClient.stream.findMany({
    where: {
      userId: createrId ?? "",
    },
  });

  return NextResponse.json({ streams });
}
