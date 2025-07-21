// fetch_synonyms.js
// Usage: node fetch_synonyms.js species_list.txt
// Reads a file with one species name per line and outputs the list of synonyms
// for each species according to the GBIF API.

import fs from 'node:fs/promises';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node fetch_synonyms.js <species_file>');
  process.exit(1);
}

async function readSpecies(file) {
  const data = await fs.readFile(file, 'utf8');
  return data.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function getUsageKey(name) {
  const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`;
  const data = await fetchJson(url);
  return data.acceptedUsageKey || data.usageKey;
}

async function getSynonyms(key) {
  const url = `https://api.gbif.org/v1/species/${key}/synonyms`;
  const data = await fetchJson(url);
  return data.results?.map(r => r.canonicalName).filter(Boolean) || [];
}

async function main() {
  const species = await readSpecies(input);
  for (const name of species) {
    try {
      const key = await getUsageKey(name);
      if (!key) {
        console.error(`No usage key found for ${name}`);
        continue;
      }
      const synonyms = await getSynonyms(key);
      console.log(`# ${name}`);
      for (const syn of synonyms) {
        console.log(syn);
      }
      console.log();
    } catch (err) {
      console.error(`Error processing ${name}: ${err.message}`);
    }
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
