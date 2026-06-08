import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const UPLOADS_DIR = join(ROOT, "public", "uploads");

const dbPath = join(ROOT, "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const TRAVEL_POSTS = [
  { title: "Sunrise Over Santorini", description: "The sun rises over the iconic white-washed buildings and blue-domed churches of Santorini, Greece. Warm orange and pink light reflects off the Aegean Sea while fishing boats bob gently in the caldera below." },
  { title: "Misty Morning in Kyoto", description: "Early morning fog drifts through a bamboo grove in Arashiyama, Kyoto. The light filters softly through towering stalks as temple bells echo in the distance and monks begin their morning walk." },
  { title: "Amalfi Coast Road Trip", description: "Winding coastal highway carved into dramatic cliffs above the turquoise Tyrrhenian Sea on Italy's Amalfi Coast. Colorful villages cling to the hillside as scooters navigate the narrow switchbacks." },
  { title: "Desert Dunes at Dusk", description: "Sweeping sand dunes of the Sahara Desert photographed at golden hour. Long shadows stretch across rippled sand as a lone camel caravan moves toward a distant oasis on the horizon." },
  { title: "Hidden Waterfall in Bali", description: "A secluded jungle waterfall tumbles into a crystal-clear pool surrounded by lush tropical ferns and mossy stone temples in the highlands of Bali, Indonesia. Mist rises from the plunge pool in the cool morning air." },
  { title: "Northern Lights in Iceland", description: "Ribbons of green and purple aurora borealis dance across a star-filled sky above a frozen lake in Iceland. A lone wooden cabin glows warmly in the foreground, perfectly reflected in the ice below." },
  { title: "Tokyo Street After Rain", description: "Neon signs reflect off wet cobblestones in a narrow alley in Shinjuku, Tokyo. Salarymen rush past ramen shops and convenience stores under colorful umbrellas as the city hums with evening energy." },
  { title: "Patagonia Trek Day 5", description: "Reaching the mirador overlooking Torres del Paine in Chilean Patagonia after a five-day backcountry trek. The three granite towers pierce low clouds while a glacial lake shimmers electric blue below." },
  { title: "Venetian Canal at Dawn", description: "A gondolier navigates the quiet back canals of Venice before the tourist crowds arrive. Morning light turns the historic palazzo facades shades of gold and terracotta, perfectly mirrored in the still green water." },
  { title: "Moroccan Souk Colors", description: "Narrow corridors of the ancient medina souk in Marrakech overflow with hand-dyed leather goods, woven rugs, and spice pyramids in vivid saffron, turmeric, and paprika. Traders call out over the sounds of hammering copper craftsmen." },
  { title: "Swiss Mountain Train", description: "The Bernina Express climbs through snow-covered Alpine meadows between Switzerland and Italy. Frozen lakes and pine forests pass the window as the train crosses a dramatic curved viaduct above a mountain village." },
  { title: "Ha Long Bay Sunrise", description: "Thousands of limestone karsts emerge from morning mist in Ha Long Bay, Vietnam. A traditional wooden junk boat drifts silently between the towering formations as local fishermen check their overnight nets." },
  { title: "Lisbon Tram Day", description: "The iconic yellow Tram 28 climbs the steep cobblestone streets of Alfama, Lisbon's oldest neighborhood. Laundry hangs between terracotta-roofed buildings as street musicians play fado in a sun-drenched square below." },
  { title: "Safari Golden Hour", description: "A pride of lions rests in tall savanna grass during golden hour in the Serengeti, Tanzania. Wildebeest graze in the distance as the sun dips toward the flat African horizon, painting the sky in deep amber." },
  { title: "New Zealand Fjord", description: "Milford Sound in New Zealand's Fiordland National Park after heavy rainfall. Dozens of temporary waterfalls cascade from near-vertical cliff faces into the dark mirror of the fjord, while a cruise boat dwarfed by the scale moves silently through." },
  { title: "Old Havana Vibes", description: "Classic 1950s American cars in pastel colors cruise the Malecón waterfront promenade in Havana, Cuba. Musicians play salsa from a rooftop bar as the faded grandeur of colonial buildings glows in the warm Caribbean afternoon light." },
  { title: "Norwegian Fishing Village", description: "Brightly painted red and ochre rorbuer fishermen's cabins reflect in the still waters of a Norwegian fjord in the Lofoten Islands. Snow-capped peaks rise dramatically behind the village as northern lights begin to appear overhead." },
  { title: "Petra at Dawn", description: "First light hits the rose-red sandstone facade of Al-Khazneh — the Treasury — in Petra, Jordan, before the tour groups arrive. A Bedouin guide leads a camel through the narrow Siq canyon in golden silence." },
  { title: "Maldives Overwater Villa", description: "An overwater bungalow extends over the impossibly clear turquoise lagoon of a Maldivian atoll. The wooden walkway leads to a glass-floor room where colorful reef fish are visible directly below, circling a coral garden." },
  { title: "Cinque Terre Hike", description: "Hikers pause on the Sentiero Azzurro trail between Vernazza and Monterosso in Cinque Terre, Italy. The five pastel-colored villages cling to dramatic sea cliffs below while vineyards terrace the steep hillsides above the trail." },
  { title: "Bangkok Night Market", description: "Vendors serve pad thai and mango sticky rice at a packed night market in Bangkok's Chatuchak district. Strings of Edison bulbs illuminate hundreds of market stalls selling street food, vintage clothing, and handmade ceramics as the city sizzles at midnight." },
  { title: "Scottish Highlands Drive", description: "A narrow single-track road winds through the dramatic glen landscape of the Scottish Highlands past a mirror-still loch. Storm clouds build over ancient mountains as a red phone box stands incongruously perfect in the foreground." },
  { title: "Colosseum Golden Light", description: "The ancient Colosseum in Rome photographed at magic hour from the Palatine Hill overlook. Amber light rakes across two thousand years of stonework as swallows circle the arches and the city hums below." },
  { title: "Bora Bora Lagoon Swim", description: "Snorkeling in the shallow warm lagoon surrounding Bora Bora, French Polynesia. Eagle rays glide effortlessly over white sand, while the iconic peak of Mount Otemanu rises above the waterline in perfect silhouette." },
  { title: "Barcelona Rooftop", description: "Looking out from a rooftop terrace in the Eixample district of Barcelona toward Gaudí's Sagrada Família at sunset. Locals sip vermouth as the city's famous grid of modernist blocks stretches to the sea, glowing orange." },
  { title: "Nepal Teahouse Trek", description: "A stone teahouse perched at 4,200m on the Annapurna Circuit in Nepal. Trekkers warm their hands on cups of butter tea as prayer flags snap in the Himalayan wind and Annapurna South dominates the view beyond the valley." },
  { title: "Positano Cliffside", description: "The stacked pastel houses of Positano tumble down the cliffside to a small beach packed with striped umbrellas on Italy's Amalfi Coast. A local boy leaps from a rock into the clear blue Mediterranean as a ferry disappears around the headland." },
  { title: "Angkor Wat Reflection", description: "The main towers of Angkor Wat temple complex reflected perfectly in the long rectangular moat at sunrise in Siem Reap, Cambodia. Monks in saffron robes walk the causeway in silence as mist lifts from the surrounding jungle." },
  { title: "Dubrovnik Old City Walls", description: "Walking the medieval city walls of Dubrovnik, Croatia, with sweeping views of the Adriatic Sea and terracotta rooftops of the old town below. A cruise ship sits on the horizon as kayakers paddle in the cove far beneath the ramparts." },
  { title: "Cappadocia Balloon Morning", description: "Dozens of hot air balloons drift silently over the alien landscape of fairy chimneys and volcanic tuff formations in Cappadocia, Turkey, just after sunrise. Cave hotels carved into the rock face glow in early morning light below the floating fleet." },
];

async function downloadImage(id, width, height) {
  const url = `https://picsum.photos/id/${id}/${width}/${height}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to download image ${id}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  console.log("Fetching image list from Picsum...");
  const listRes = await fetch("https://picsum.photos/v2/list?page=1&limit=100");
  const allImages = await listRes.json();

  // Grab more images than posts so we can pick landscape-ish ones (skip portraits)
  const images = allImages.slice(0, TRAVEL_POSTS.length);

  if (!existsSync(UPLOADS_DIR)) {
    await mkdir(UPLOADS_DIR, { recursive: true });
  }

  const minOrderPost = await prisma.post.findFirst({
    orderBy: { order: "asc" },
    select: { order: true },
  });
  let currentOrder = (minOrderPost?.order ?? 0) - images.length;

  console.log(`Downloading and seeding ${images.length} posts...\n`);

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const content = TRAVEL_POSTS[i];

    try {
      // Download portrait crop (1080x1350) — standard social media format
      const buffer = await downloadImage(image.id, 1080, 1350);
      const filename = `${randomUUID()}.jpg`;
      await writeFile(join(UPLOADS_DIR, filename), buffer);

      await prisma.post.create({
        data: {
          title: content.title,
          description: content.description,
          status: "draft",
          order: currentOrder++,
          media: {
            create: {
              filename,
              originalName: `${content.title.toLowerCase().replace(/\s+/g, "-")}.jpg`,
              mimeType: "image/jpeg",
              size: buffer.length,
            },
          },
        },
      });

      console.log(`✓ [${i + 1}/${images.length}] ${content.title}`);
    } catch (err) {
      console.error(`✗ [${i + 1}/${images.length}] ${content.title} — ${err.message}`);
    }

    // Small delay to be respectful of Picsum
    await new Promise((r) => setTimeout(r, 150));
  }

  await prisma.$disconnect();
  console.log(`\nDone! ${images.length} posts seeded.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
