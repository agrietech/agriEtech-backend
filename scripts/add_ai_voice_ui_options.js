const fs = require('fs');

console.log('Adding AI Voice UI options to HomeScreen and MainNavigationShell...');

// 1. Update main_navigation_shell.dart center icon to Microphone (Icons.mic_rounded)
const shellPath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/home/screens/main_navigation_shell.dart';
if (fs.existsSync(shellPath)) {
  let content = fs.readFileSync(shellPath, 'utf8');
  if (content.includes('Icons.psychology')) {
    content = content.replace(/Icons\.psychology/g, 'Icons.mic_rounded');
    fs.writeFileSync(shellPath, content, 'utf8');
    console.log('✅ UPDATED main_navigation_shell.dart center navigation icon to Icons.mic_rounded!');
  }
}

// 2. Update home_screen.dart to include AI Voice Assistant card and prominent Voice FAB
const homePath = 'C:/Users/a/Desktop/agrietech-frontend/lib/features/home/screens/home_screen.dart';
if (fs.existsSync(homePath)) {
  let content = fs.readFileSync(homePath, 'utf8');

  // Update Floating Action Button label to "Ask AI Voice (ድምፅ)" and icon to mic_rounded
  if (content.includes("label: const Text(\n          'Agri-AI Assistant',")) {
    content = content.replace(
      "icon: const Icon(Icons.psychology, color: Color(0xFFF59E0B)),\n        label: const Text(\n          'Agri-AI Assistant',",
      "icon: const Icon(Icons.mic_rounded, color: Color(0xFFF59E0B), size: 24),\n        label: const Text(\n          'Ask AI Voice (ድምፅ)',"
    );
  } else if (content.includes("Icons.psychology")) {
    content = content.replace(/Icons\.psychology/g, 'Icons.mic_rounded');
  }

  // Insert AI Voice Assistant grid item at the top of GridView
  if (content.includes("children: [\n                      _buildTechMenuCard(")) {
    const aiVoiceCard = `children: [
                      InkWell(
                        onTap: () => AiAssistantSheet.show(context),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF1B5E20), Color(0xFF0F3E14)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF1B5E20).withValues(alpha: 0.3),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                            border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.6), width: 1.5),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(Icons.mic_rounded, color: Color(0xFFF59E0B), size: 22),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF59E0B),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Text(
                                      'Voice AI',
                                      style: TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text(
                                    'AI Voice Assistant',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'አማርኛ & English Voice Q&A',
                                    style: TextStyle(color: Colors.white70, fontSize: 11),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      _buildTechMenuCard(`;

    content = content.replace("children: [\n                      _buildTechMenuCard(", aiVoiceCard);
  }

  fs.writeFileSync(homePath, content, 'utf8');
  console.log('✅ UPDATED home_screen.dart with AI Voice grid card and prominent Ask AI Voice (ድምፅ) FAB!');
}

console.log('AI Voice UI integration completed.');
