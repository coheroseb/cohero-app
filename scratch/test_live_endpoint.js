
// Test the live explainConceptFlow endpoint
async function testLive() {
  const url = 'https://runaiflow-7pguetq4hq-uc.a.run.app/runAiFlow';
  
  console.log('Testing live explainConceptFlow for "Bourdieu"...\n');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SHDFJ232341GHFD'
    },
    body: JSON.stringify({
      flowName: 'explainConceptFlow',
      data: {
        concept: 'Bourdieu',
        profession: 'Socialrådgiver'
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('HTTP Error', response.status, text.substring(0, 500));
    process.exit(1);
  }

  const result = await response.json();
  const data = result?.result?.data || result?.data || result;
  
  console.log('=== SVAR ===');
  
  if (data?.suggestedLiterature && Array.isArray(data.suggestedLiterature)) {
    console.log('\n📚 Foreslåede bøger/kapitler:');
    data.suggestedLiterature.forEach((lit, i) => {
      console.log(`  ${i+1}. ${lit.apaCitation || lit.title || JSON.stringify(lit).substring(0, 100)}`);
    });
  } else {
    console.log('\nsuggested literature:', JSON.stringify(data?.suggestedLiterature, null, 2)?.substring(0, 500));
    console.log('\nFull keys:', Object.keys(data || result || {}));
  }
  
  // Check for static fallback (De tre Huse / Dialoglinealen)
  const fullStr = JSON.stringify(data);
  if (fullStr.includes('De tre Huse') || fullStr.includes('Dialoglinealen')) {
    console.log('\n❌ FEJL: Svaret indeholder stadig de statiske fallback referencer!');
  } else {
    console.log('\n✅ Ingen statiske fallback referencer fundet - vector søgning bruges!');
  }
}

testLive().catch(console.error);
