const fs = require('fs');
const p = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/diagnosis/repositories/diagnosis_repository.dart';
let c = fs.readFileSync(p, 'utf8');
c = c.replace("'/disease-diagnosis/farm/$farmId'", "ApiEndpoints.farmDiagnoses(farmId)");
c = c.replace("'/disease-diagnosis'", "ApiEndpoints.diseaseDiagnosis");
fs.writeFileSync(p, c, 'utf8');
console.log('Successfully updated diagnosis_repository.dart');
