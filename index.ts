import fs from "fs"
import client from "neo4j-driver"
import cql from "./cyphertag"

const driver = client.driver("bolt://localhost:7687")
const session = driver.session()

await session.run(cql`MATCH (n)-[r]-(m) DETACH DELETE n,r,m`)

const relate = (relation: string) => (faction1: string, faction2: string) =>
	session.run(
		cql`
			MERGE (a:Faction { name: $faction1 })
			MERGE (b:Faction { name: $faction2 })
			MERGE (a)-[:${relation}]->(b)
		`,
		{
			faction1,
			faction2,
		},
	)

const separators: [string, ReturnType<typeof relate>][] = [
	["+", relate("allies")],
	["|", relate("enemies")],
	["-", relate("pact")],
]

for (const line of fs.readFileSync("./ALLIES", "utf8").split("\n")) {
	for (const sep of separators) {
		if (!line.includes(sep[0])) continue

		const factions = line.split(sep[0]).map(s => s.trim())
		await sep[1](factions[0], factions[1])
	}
}

await session.close()
await driver.close()
process.exit(0)
