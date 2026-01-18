const fs = require('fs');
const path = require('path');

function writeWav(filename, buffer, sampleRate = 44100) {
    const dataSize = buffer.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const header = Buffer.alloc(headerSize);

    // RIFF chunk
    header.write('RIFF', 0);
    header.writeUInt32LE(totalSize - 8, 4);
    header.write('WAVE', 8);

    // fmt chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size
    header.writeUInt16LE(1, 20); // AudioFormat (PCM)
    header.writeUInt16LE(1, 22); // NumChannels (Mono)
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    header.writeUInt16LE(2, 32); // BlockAlign
    header.writeUInt16LE(16, 34); // BitsPerSample

    // data chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    const fileBuffer = Buffer.concat([header, buffer]);
    fs.writeFileSync(filename, fileBuffer);
    console.log(`Generated ${filename}`);
}

function generateSineWave(freq, duration, volume = 0.5) {
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);

    for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const value = Math.sin(2 * Math.PI * freq * t) * volume;
        const intValue = Math.max(-32768, Math.min(32767, value * 32767));
        buffer.writeInt16LE(intValue, i * 2);
    }
    return buffer;
}

function generateNoise(duration, volume = 0.5) {
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    const buffer = Buffer.alloc(samples * 2);

    for (let i = 0; i < samples; i++) {
        const value = (Math.random() * 2 - 1) * volume;
        const intValue = Math.max(-32768, Math.min(32767, value * 32767));
        buffer.writeInt16LE(intValue, i * 2);
    }
    return buffer;
}

// Generate sounds
const soundsDir = path.join(process.cwd(), 'public', 'sounds');

// Grab (Pinch) - Short high pitched pop
writeWav(path.join(soundsDir, 'grab.wav'), generateSineWave(800, 0.1, 0.3));

// Magic (Fist) - Lower chime/hum
writeWav(path.join(soundsDir, 'magic.wav'), generateSineWave(200, 0.3, 0.4));

// Wind (Peace) - White noise swoosh
writeWav(path.join(soundsDir, 'wind.wav'), generateNoise(0.5, 0.2));

console.log('Done generating sounds');
