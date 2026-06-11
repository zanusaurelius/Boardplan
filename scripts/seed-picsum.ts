/**
 * Seed script for boardplan portfolio demo.
 * Downloads images from picsum.photos and uploads them to Vercel Blob for stable hosting.
 * Creates posts with rich travel/lifestyle descriptions ready for caption generation.
 *
 * Usage:
 *   npx tsx --env-file .env.local scripts/seed-picsum.ts
 */

import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  "";

if (!connectionString) {
  console.error("No DATABASE_URL found. Set it before running this script.");
  process.exit(1);
}

const adapter = new PrismaNeonHttp(connectionString, {});
const prisma = new PrismaClient({ adapter });

const POSTS = [
  { title: "Sunrise Over Santorini", description: "The sun rises over the iconic white-washed buildings and blue-domed churches of Santorini, Greece. Warm orange and pink light reflects off the Aegean Sea while fishing boats bob gently in the caldera below." },
  { title: "Misty Morning in Kyoto", description: "Early morning fog drifts through a bamboo grove in Arashiyama, Kyoto. The light filters softly through towering stalks as temple bells echo in the distance and monks begin their morning walk." },
  { title: "Amalfi Coast Road Trip", description: "Winding coastal highway carved into dramatic cliffs above the turquoise Tyrrhenian Sea on Italy's Amalfi Coast. Colorful villages cling to the hillside as scooters navigate the narrow switchbacks." },
  { title: "Desert Dunes at Dusk", description: "Sweeping sand dunes of the Sahara Desert photographed at golden hour. Long shadows stretch across rippled sand as a lone camel caravan moves toward a distant oasis on the horizon." },
  { title: "Hidden Waterfall in Bali", description: "A secluded jungle waterfall tumbles into a crystal-clear pool surrounded by lush tropical ferns and mossy stone temples in the highlands of Bali, Indonesia." },
  { title: "Northern Lights in Iceland", description: "Ribbons of green and purple aurora borealis dance across a star-filled sky above a frozen lake in Iceland. A lone wooden cabin glows warmly in the foreground, perfectly reflected in the ice below." },
  { title: "Tokyo Street After Rain", description: "Neon signs reflect off wet cobblestones in a narrow alley in Shinjuku, Tokyo. Salarymen rush past ramen shops and convenience stores under colorful umbrellas as the city hums with evening energy." },
  { title: "Patagonia Trek Day 5", description: "Reaching the mirador overlooking Torres del Paine in Chilean Patagonia after a five-day backcountry trek. The three granite towers pierce low clouds while a glacial lake shimmers electric blue below." },
  { title: "Venetian Canal at Dawn", description: "A gondolier navigates the quiet back canals of Venice before the tourist crowds arrive. Morning light turns the historic palazzo facades shades of gold and terracotta, perfectly mirrored in the still green water." },
  { title: "Moroccan Souk Colors", description: "Narrow corridors of the ancient medina souk in Marrakech overflow with hand-dyed leather goods, woven rugs, and spice pyramids in vivid saffron, turmeric, and paprika." },
  { title: "Swiss Mountain Train", description: "The Bernina Express climbs through snow-covered Alpine meadows between Switzerland and Italy. Frozen lakes and pine forests pass the window as the train crosses a dramatic curved viaduct above a mountain village." },
  { title: "Ha Long Bay Sunrise", description: "Thousands of limestone karsts emerge from morning mist in Ha Long Bay, Vietnam. A traditional wooden junk boat drifts silently between the towering formations as local fishermen check their overnight nets." },
  { title: "Lisbon Tram Day", description: "The iconic yellow Tram 28 climbs the steep cobblestone streets of Alfama, Lisbon's oldest neighborhood. Laundry hangs between terracotta-roofed buildings as street musicians play fado in a sun-drenched square below." },
  { title: "Safari Golden Hour", description: "A pride of lions rests in tall savanna grass during golden hour in the Serengeti, Tanzania. Wildebeest graze in the distance as the sun dips toward the flat African horizon, painting the sky in deep amber." },
  { title: "New Zealand Fjord", description: "Milford Sound in New Zealand's Fiordland National Park after heavy rainfall. Dozens of temporary waterfalls cascade from near-vertical cliff faces into the dark mirror of the fjord." },
  { title: "Old Havana Vibes", description: "Classic 1950s American cars in pastel colors cruise the Malecón waterfront promenade in Havana, Cuba. Musicians play salsa from a rooftop bar as the faded grandeur of colonial buildings glows in the warm Caribbean afternoon light." },
  { title: "Norwegian Fishing Village", description: "Brightly painted red and ochre fishermen's cabins reflect in the still waters of a Norwegian fjord in the Lofoten Islands. Snow-capped peaks rise dramatically behind the village as northern lights begin to appear overhead." },
  { title: "Petra at Dawn", description: "First light hits the rose-red sandstone facade of Al-Khazneh — the Treasury — in Petra, Jordan, before the tour groups arrive. A Bedouin guide leads a camel through the narrow Siq canyon in golden silence." },
  { title: "Maldives Overwater Villa", description: "An overwater bungalow extends over the impossibly clear turquoise lagoon of a Maldivian atoll. The wooden walkway leads to a glass-floor room where colorful reef fish are visible directly below, circling a coral garden." },
  { title: "Cinque Terre Hike", description: "Hikers pause on the Sentiero Azzurro trail between Vernazza and Monterosso in Cinque Terre, Italy. The five pastel-colored villages cling to dramatic sea cliffs below while vineyards terrace the steep hillsides above the trail." },
  { title: "Bangkok Night Market", description: "Vendors serve pad thai and mango sticky rice at a packed night market in Bangkok's Chatuchak district. Strings of Edison bulbs illuminate hundreds of stalls selling street food, vintage clothing, and handmade ceramics." },
  { title: "Scottish Highlands Drive", description: "A narrow single-track road winds through the dramatic glen landscape of the Scottish Highlands past a mirror-still loch. Storm clouds build over ancient mountains as a red phone box stands incongruously perfect in the foreground." },
  { title: "Colosseum Golden Light", description: "The ancient Colosseum in Rome photographed at magic hour from the Palatine Hill overlook. Amber light rakes across two thousand years of stonework as swallows circle the arches and the city hums below." },
  { title: "Bora Bora Lagoon Swim", description: "Snorkeling in the shallow warm lagoon surrounding Bora Bora, French Polynesia. Eagle rays glide effortlessly over white sand, while the iconic peak of Mount Otemanu rises above the waterline in perfect silhouette." },
  { title: "Barcelona Rooftop", description: "Looking out from a rooftop terrace in the Eixample district of Barcelona toward Gaudí's Sagrada Família at sunset. Locals sip vermouth as the city's grid of modernist blocks stretches to the sea, glowing orange." },
  { title: "Nepal Teahouse Trek", description: "A stone teahouse perched at 4,200m on the Annapurna Circuit in Nepal. Trekkers warm their hands on cups of butter tea as prayer flags snap in the Himalayan wind and Annapurna South dominates the view beyond the valley." },
  { title: "Positano Cliffside", description: "The stacked pastel houses of Positano tumble down the cliffside to a small beach packed with striped umbrellas on Italy's Amalfi Coast. A local boy leaps from a rock into the clear blue Mediterranean as a ferry disappears around the headland." },
  { title: "Angkor Wat Reflection", description: "The main towers of Angkor Wat temple complex reflected perfectly in the long rectangular moat at sunrise in Siem Reap, Cambodia. Monks in saffron robes walk the causeway in silence as mist lifts from the surrounding jungle." },
  { title: "Dubrovnik City Walls", description: "Walking the medieval city walls of Dubrovnik, Croatia, with sweeping views of the Adriatic Sea and terracotta rooftops of the old town below. Kayakers paddle in the cove far beneath the ramparts." },
  { title: "Cappadocia Balloons", description: "Dozens of hot air balloons drift silently over the alien landscape of fairy chimneys and volcanic tuff formations in Cappadocia, Turkey, just after sunrise. Cave hotels carved into the rock face glow in early morning light below the floating fleet." },
];

async function uploadFromUrl(url: string, slug: string): Promise<{ blobUrl: string; size: number }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const filename = `${uuidv4()}-${slug}.jpg`;
  const blob = await put(filename, buffer, { access: "public", contentType: "image/jpeg" });
  return { blobUrl: blob.url, size: buffer.byteLength };
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN not set — cannot upload to Vercel Blob.");
    process.exit(1);
  }

  console.log("Clearing existing posts...");
  await prisma.media.deleteMany({});
  await prisma.post.deleteMany({});
  console.log("Cleared.\n");

  console.log(`Seeding ${POSTS.length} posts...\n`);

  for (let i = 0; i < POSTS.length; i++) {
    const { title } = POSTS[i];
    const picsumUrl = `https://picsum.photos/seed/${i + 10}/1080/1350`;
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    process.stdout.write(`[${i + 1}/${POSTS.length}] ${title} — downloading...`);
    const { blobUrl, size } = await uploadFromUrl(picsumUrl, slug);
    process.stdout.write(` uploaded\n`);

    const post = await prisma.post.create({
      data: { title, description: "", status: "draft", order: i, isDemo: true },
    });

    await prisma.media.create({
      data: {
        postId: post.id,
        filename: blobUrl,
        originalName: `${slug}.jpg`,
        mimeType: "image/jpeg",
        size,
      },
    });

    console.log(`✓ [${i + 1}/${POSTS.length}] ${title}`);
  }

  console.log(`\nDone! ${POSTS.length} posts seeded.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
