// Script untuk update semua timestamp ke WIB
// Run: docker exec eco_mongo mongosh eco_ledger_db update_timestamps_to_wib.js

// Update admin user timestamp
var adminUser = db.users.findOne({email: 'admin@ecoledger.com'});
if (adminUser) {
    var d = new Date();
    d.setHours(d.getHours() + 7);
    var wibTime = d.toISOString().replace('Z', '+07:00');
    db.users.updateOne(
        {_id: adminUser._id}, 
        {$set: {created_at: wibTime}}
    );
    print('✅ Updated admin created_at to WIB: ' + wibTime);
} else {
    print('ℹ️  Admin not found');
}

// Update all activity_logs timestamps
var activities = db.activity_logs.find({});
var count = 0;
activities.forEach(function(activity) {
    if (activity.timestamp && !activity.timestamp.includes('+07:00')) {
        var oldDate = new Date(activity.timestamp);
        oldDate.setHours(oldDate.getHours() + 7);
        var wibTimestamp = oldDate.toISOString().replace('Z', '+07:00');
        db.activity_logs.updateOne(
            {_id: activity._id},
            {$set: {timestamp: wibTimestamp}}
        );
        count++;
    }
});
print('✅ Updated ' + count + ' activity_logs timestamps to WIB');

print('\n✨ All timestamps updated to WIB!');
