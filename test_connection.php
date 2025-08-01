// Simple test for network connectivity to server
export async function testNetworkConnection() {
  try {
    console.log('Testing network connectivity to server...');
    const response = await fetch(`https://php-api-1-1go8.onrender.com/get_user.php`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.text();
      console.log('Server response:', data);
      return { success: true, message: 'Network connection successful' };
    } else {
      return { success: false, message: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    console.error('Network test failed:', error);
    return { success: false, message: error.message };
  }
}
