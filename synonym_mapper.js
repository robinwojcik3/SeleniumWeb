import fs from 'fs/promises';

async function fetchSynonyms(name) {
  const matchResp = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`);
  if (!matchResp.ok) throw new Error(`Match request failed for ${name}`);
  const match = await matchResp.json();
  const key = match.acceptedUsageKey || match.usageKey;
  if (!key) return [];
  const synResp = await fetch(`https://api.gbif.org/v1/species/${key}/synonyms`);
  if (!synResp.ok) throw new Error(`Synonyms request failed for ${name}`);
  const synData = await synResp.json();
  const names = new Set();
  if (match.canonicalName) names.add(match.canonicalName);
  if (match.scientificName) names.add(match.scientificName);
  for (const r of synData.results || []) {
    if (r.canonicalName) names.add(r.canonicalName);
    else if (r.scientificName) names.add(r.scientificName);
  }
  return Array.from(names);
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node synonym_mapper.js <species_list.txt>');
    process.exit(1);
  }
  const text = await fs.readFile(file, 'utf8');
  const names = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const mapping = {};
  for (const name of names) {
    try {
      mapping[name] = await fetchSynonyms(name);
    } catch (err) {
      console.error('Error fetching', name, err.message);
    }
  }
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
