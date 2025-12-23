import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ABACATE_PAY_KEY = process.env.ABACATE_PAY_KEY;
const url = 'https://api.abacatepay.com/v1/pixQrCode/create';

// VALID GENERATED CPF for testing
const VALID_CPF = '52998224725';
const FORMATTED_CPF = '529.982.247-25';

async function testPayment(taxId: string, description: string) {
    console.log(`Testing with taxId: "${taxId}" (${description})...`);
    try {
        const payload = {
            amount: 100,
            description: 'Test Script',
            customer: {
                name: 'Test User',
                cellphone: '11999999999',
                email: 'test@example.com',
                taxId: taxId
            }
        };

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${ABACATE_PAY_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`SUCCESS! (${description})`);
        console.log('Response:', response.data);
    } catch (error: any) {
        console.error(`FAILED (${description})`);
        console.error('Error:', error.response?.data || error.message);
    }
    console.log('---');
}

async function run() {
    await testPayment(VALID_CPF, 'Sanitized / Digits Only');
    await testPayment(FORMATTED_CPF, 'Formatted (Dots/Dash)');
}

run();
