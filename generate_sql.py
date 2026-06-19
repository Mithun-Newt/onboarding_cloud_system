import pandas as pd
import uuid

df = pd.read_excel('2025-26 GIFT Transport - Bus Attendance .xlsx', sheet_name='Bus Sto & Stage ', engine='openpyxl')

routes = {}
stops = []

NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, 'appu.school.transport')

for index, row in df.iterrows():
    place_name = str(row.get('Place Name', '')).strip()
    stage = row.get('Stage')
    kilo_metre = row.get('Kilo Metre')
    
    if pd.isna(stage) or not place_name or place_name == 'nan':
        continue
    stage = str(int(stage)) if isinstance(stage, float) else str(stage).strip()
    kilo_metre = str(kilo_metre) if not pd.isna(kilo_metre) else None
    
    if stage not in routes:
        routes[stage] = str(uuid.uuid5(NAMESPACE, f'route_stage_{stage}'))
        
    stops.append((place_name, stage, kilo_metre))

unique_stops = []
seen = set()
for p, s, km in stops:
    if (p, s) not in seen:
        seen.add((p, s))
        unique_stops.append((p, s, km))

sql = 'DO $$ BEGIN\n'

sql += '    -- ---------------------------------------------------------------------------\n'
sql += '    -- Bus Routes (Stages)\n'
sql += '    -- ---------------------------------------------------------------------------\n'

sql += '    INSERT INTO bus_routes (id, "routeNo", name, "isActive") VALUES\n'
route_values = []
for stage, route_id in routes.items():
    route_values.append(f"        ('{route_id}', 'STAGE_{stage}', 'Stage {stage}', TRUE)")
sql += ',\n'.join(route_values) + '\n    ON CONFLICT ("id") DO NOTHING;\n\n'

sql += '\n    -- Bus Stops\n'
sql += '    INSERT INTO bus_stops (id, "routeId", "stopName", stage, distance) VALUES\n'
stop_values = []
for p, s, km in unique_stops:
    p_clean = p.replace("'", "''")
    km_str = f"'{km}'" if km else 'NULL'
    stop_id = str(uuid.uuid5(NAMESPACE, f'stop_{s}_{p}'))
    stop_values.append(f"        ('{stop_id}', '{routes[s]}', '{p_clean}', '{s}', {km_str})")

sql += ',\n'.join(stop_values) + '\n    ON CONFLICT ("id") DO NOTHING;\n'

sql += 'END $$;\n'

with open('seed_transport.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
print('Generated seed_transport.sql successfully.')
