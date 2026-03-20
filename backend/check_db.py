from pymongo import MongoClient

client = MongoClient('mongodb+srv://evansmeshack6_db_user:Vin%402020@cluster0.kosl8u7.mongodb.net/')
db = client['movievault']

# Check movies collection
movies = list(db.movies.find({}, {'title': 1, '_id': 1}).limit(5))
print('Movies in database:', len(movies))
for m in movies:
    print(f'  - {m.get("title", "No title")} (ID: {m.get("_id")})')

# Check series collection  
series = list(db.series.find({}, {'title': 1, '_id': 1}).limit(5))
print('\nSeries in database:', len(series))
for s in series:
    print(f'  - {s.get("title", "No title")} (ID: {s.get("_id")})')

# Check music collection
music = list(db.music.find({}, {'title': 1, '_id': 1}).limit(5))
print('\nMusic in database:', len(music))
for m in music:
    print(f'  - {m.get("title", "No title")} (ID: {m.get("_id")})')

client.close()
