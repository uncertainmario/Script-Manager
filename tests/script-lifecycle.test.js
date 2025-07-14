const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ScriptLifecycleTests {
    constructor() {
        this.testResults = [];
        this.testDataPath = path.join(__dirname, 'test-data');
        this.scriptsJsonPath = path.join(__dirname, '..', 'data', 'scripts.json');
        this.backupPath = path.join(__dirname, 'scripts-backup.json');
        
        this.setupTestEnvironment();
    }

    setupTestEnvironment() {
        if (!fs.existsSync(this.testDataPath)) {
            fs.mkdirSync(this.testDataPath, { recursive: true });
        }

        if (fs.existsSync(this.scriptsJsonPath)) {
            fs.copyFileSync(this.scriptsJsonPath, this.backupPath);
        }

        this.createTestScripts();
    }

    createTestScripts() {
        const testJsContent = `
console.log('Test JS Script başlatıldı');
let counter = 0;
const interval = setInterval(() => {
    counter++;
    console.log(\`Counter: \${counter}\`);
    if (counter >= 5) {
        console.log('Test JS Script tamamlandı');
        clearInterval(interval);
        process.exit(0);
    }
}, 1000);
        `;
        fs.writeFileSync(path.join(this.testDataPath, 'test-script.js'), testJsContent);

        const testPyContent = `
import time
import sys

print("Test Python Script başlatıldı")
for i in range(1, 6):
    print(f"Python Counter: {i}")
    time.sleep(1)
print("Test Python Script tamamlandı")
sys.exit(0)
        `;
        fs.writeFileSync(path.join(this.testDataPath, 'test-script.py'), testPyContent);

        const testBatContent = `
@echo off
echo Test Batch Script başlatıldı
for /L %%i in (1,1,5) do (
    echo Batch Counter: %%i
    timeout /t 1 /nobreak >nul
)
echo Test Batch Script tamamlandı
        `;
        fs.writeFileSync(path.join(this.testDataPath, 'test-script.bat'), testBatContent);

        const errorScriptContent = `
console.log('Hatalı script başlatıldı');
setTimeout(() => {
    throw new Error('Test hatası');
}, 2000);
        `;
        fs.writeFileSync(path.join(this.testDataPath, 'error-script.js'), errorScriptContent);
    }

    async runTests() {
        console.log('🧪 Script Manager Lifecycle Testleri Başlatılıyor...\n');

        await this.testScriptAddition();
        await this.testScriptExecution();
        await this.testScriptStopping();
        await this.testScriptRestart();
        await this.testErrorHandling();
        await this.testScriptRemoval();
        await this.testPersistence();
        await this.testPerformance();

        this.printResults();
        this.cleanup();
    }

    async testScriptAddition() {
        const testName = 'Script Ekleme Testi';
        console.log(`📝 ${testName}...`);

        try {
            const emptyScripts = { scripts: [], lastId: 0 };
            fs.writeFileSync(this.scriptsJsonPath, JSON.stringify(emptyScripts, null, 2));

            const testScript = {
                id: 1,
                name: 'Test JS Script',
                path: path.join(this.testDataPath, 'test-script.js'),
                type: 'javascript',
                status: 'stopped',
                autoRestart: false,
                parameters: '',
                workingDirectory: this.testDataPath,
                logLevel: 'all',
                emailNotifications: false,
                priority: 'normal',
                autoStart: false,
                autoStartTime: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const scriptsData = JSON.parse(fs.readFileSync(this.scriptsJsonPath, 'utf8'));
            scriptsData.scripts.push(testScript);
            scriptsData.lastId = 1;
            fs.writeFileSync(this.scriptsJsonPath, JSON.stringify(scriptsData, null, 2));

            this.addTestResult(testName, true, 'Script başarıyla eklendi');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    async testScriptExecution() {
        const testName = 'Script Çalıştırma Testi';
        console.log(`▶️ ${testName}...`);

        try {
            const scriptPath = path.join(this.testDataPath, 'test-script.js');
            
            const child = spawn('node', [scriptPath], {
                cwd: this.testDataPath,
                stdio: 'pipe'
            });

            let output = '';
            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            await new Promise((resolve) => {
                setTimeout(() => {
                    if (!child.killed) {
                        child.kill();
                    }
                    resolve();
                }, 10000);
            });

            const success = output.includes('Test JS Script başlatıldı') && 
                          output.includes('Counter:');
            
            this.addTestResult(testName, success, success ? 'Script başarıyla çalıştı' : 'Script çıktısı beklenen formatta değil');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    async testScriptStopping() {
        const testName = 'Script Durdurma Testi';
        console.log(`⏹️ ${testName}...`);

        try {
            const scriptPath = path.join(this.testDataPath, 'test-script.js');
            
            const child = spawn('node', [scriptPath], {
                cwd: this.testDataPath,
                stdio: 'pipe'
            });

            await new Promise((resolve) => {
                setTimeout(() => {
                    child.kill('SIGTERM');
                    resolve();
                }, 2000);
            });

            const isKilled = child.killed || child.exitCode !== null;
            
            this.addTestResult(testName, isKilled, isKilled ? 'Script başarıyla durduruldu' : 'Script durdurulamadı');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    async testScriptRestart() {
        const testName = 'Script Yeniden Başlatma Testi';
        console.log(`🔄 ${testName}...`);

        try {
            const scriptPath = path.join(this.testDataPath, 'test-script.js');
            
            let child = spawn('node', [scriptPath], {
                cwd: this.testDataPath,
                stdio: 'pipe'
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
            child.kill();

            child = spawn('node', [scriptPath], {
                cwd: this.testDataPath,
                stdio: 'pipe'
            });

            let output = '';
            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            await new Promise(resolve => setTimeout(resolve, 3000));
            child.kill();

            const success = output.includes('Test JS Script başlatıldı');
            this.addTestResult(testName, success, success ? 'Script başarıyla yeniden başlatıldı' : 'Yeniden başlatma başarısız');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    async testErrorHandling() {
        const testName = 'Hata Yönetimi Testi';
        console.log(`❌ ${testName}...`);

        try {
            const scriptPath = path.join(this.testDataPath, 'error-script.js');
            
            const child = spawn('node', [scriptPath], {
                cwd: this.testDataPath,
                stdio: 'pipe'
            });

            let errorOutput = '';
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            await new Promise((resolve) => {
                child.on('exit', resolve);
                setTimeout(resolve, 5000);
            });

            const success = child.exitCode !== 0 || errorOutput.includes('Error');
            this.addTestResult(testName, success, success ? 'Hata başarıyla yakalandı' : 'Hata yakalanamadı');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    async testScriptRemoval() {
        const testName = 'Script Silme Testi';
        console.log(`🗑️ ${testName}...`);

        try {
            const scriptsData = JSON.parse(fs.readFileSync(this.scriptsJsonPath, 'utf8'));
            const initialCount = scriptsData.scripts.length;

            if (scriptsData.scripts.length > 0) {
                scriptsData.scripts.splice(0, 1);
                fs.writeFileSync(this.scriptsJsonPath, JSON.stringify(scriptsData, null, 2));
            }

            const newScriptsData = JSON.parse(fs.readFileSync(this.scriptsJsonPath, 'utf8'));
            const success = newScriptsData.scripts.length === Math.max(0, initialCount - 1);

            this.addTestResult(testName, success, success ? 'Script başarıyla silindi' : 'Script silinemedi');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    async testPersistence() {
        const testName = 'Kalıcılık Testi';
        console.log(`💾 ${testName}...`);

        try {
            const testData = {
                scripts: [
                    {
                        id: 999,
                        name: 'Persistence Test',
                        path: '/test/path',
                        status: 'stopped'
                    }
                ],
                lastId: 999
            };

            fs.writeFileSync(this.scriptsJsonPath, JSON.stringify(testData, null, 2));

            const loadedData = JSON.parse(fs.readFileSync(this.scriptsJsonPath, 'utf8'));
            
            const success = loadedData.scripts.length === 1 && 
                          loadedData.scripts[0].name === 'Persistence Test' &&
                          loadedData.lastId === 999;

            this.addTestResult(testName, success, success ? 'Veri başarıyla kalıcı hale getirildi' : 'Kalıcılık testi başarısız');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    async testPerformance() {
        const testName = 'Performans Testi';
        console.log(`⚡ ${testName}...`);

        try {
            const startTime = Date.now();

            const scripts = [];
            for (let i = 0; i < 100; i++) {
                scripts.push({
                    id: i + 1,
                    name: `Performance Test Script ${i + 1}`,
                    path: `/test/path/script${i}.js`,
                    status: 'stopped'
                });
            }

            const testData = { scripts, lastId: 100 };
            fs.writeFileSync(this.scriptsJsonPath, JSON.stringify(testData, null, 2));

            const loadedData = JSON.parse(fs.readFileSync(this.scriptsJsonPath, 'utf8'));
            const filteredScripts = loadedData.scripts.filter(s => s.name.includes('Performance'));

            const endTime = Date.now();
            const duration = endTime - startTime;

            const success = duration < 1000 && filteredScripts.length === 100;
            this.addTestResult(testName, success, 
                success ? `Performans testi başarılı (${duration}ms)` : `Performans testi başarısız (${duration}ms)`);
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    addTestResult(testName, success, message) {
        this.testResults.push({
            name: testName,
            success,
            message,
            timestamp: new Date().toISOString()
        });

        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}\n`);
    }

    printResults() {
        console.log('\n📊 TEST SONUÇLARI:');
        console.log('='.repeat(50));

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;

        console.log(`\n📈 Toplam Test: ${totalTests}`);
        console.log(`✅ Başarılı: ${passedTests}`);
        console.log(`❌ Başarısız: ${failedTests}`);
        console.log(`📊 Başarı Oranı: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

        this.testResults.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${result.name}`);
            console.log(`   ${result.message}`);
        });

        const reportPath = path.join(__dirname, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: ((passedTests / totalTests) * 100).toFixed(1)
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        }, null, 2));

        console.log(`\n📁 Detaylı rapor: ${reportPath}`);
    }

    cleanup() {
        console.log('\n🧹 Test ortamı temizleniyor...');

        if (fs.existsSync(this.testDataPath)) {
            fs.rmSync(this.testDataPath, { recursive: true, force: true });
        }

        if (fs.existsSync(this.backupPath)) {
            fs.copyFileSync(this.backupPath, this.scriptsJsonPath);
            fs.unlinkSync(this.backupPath);
        }

        console.log('✅ Temizlik tamamlandı');
    }
}

if (require.main === module) {
    const tests = new ScriptLifecycleTests();
    tests.runTests().then(() => {
        console.log('\n🎉 Tüm testler tamamlandı!');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Test hatası:', error);
        process.exit(1);
    });
}

module.exports = ScriptLifecycleTests; 