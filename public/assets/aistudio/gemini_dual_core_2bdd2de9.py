import json
import concurrent.futures
import time
import logging
import argparse
import sys
import random
import os

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - [%(threadName)s] - %(message)s',
    handlers=[
        logging.FileHandler("gemini_dual_core.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

class GeminiInstance:
    def __init__(self, name, config):
        self.name = name
        self.api_key = config.get('api_key')
        self.endpoint = config.get('endpoint')
        self.model = config.get('model', 'gemini-pro')
        self.timeout = config.get('timeout', 30)
        self.status = "ACTIVE"

    def send_request(self, prompt):
        """Simulates or performs the actual request."""
        logging.info(f"Instance [{self.name}] receiving task: {prompt[:30]}...")
        start_time = time.time()
        
        # Simulate network latency and processing
        # In a real scenario, this would be requests.post(self.endpoint, headers=..., json=...)
        sleep_time = random.uniform(0.5, 2.0)
        time.sleep(sleep_time)
        
        # Mock response based on the instance's unique config
        response = f"[{self.name}/{self.model}] Processed: '{prompt}' (Latency: {sleep_time:.2f}s)"
        
        duration = time.time() - start_time
        logging.info(f"Instance [{self.name}] completed task in {duration:.2f}s")
        return {
            "instance": self.name,
            "response": response,
            "duration": duration,
            "status": "SUCCESS"
        }

class LoadBalancer:
    def __init__(self, instances):
        self.instances = instances
        self.index = 0

    def get_next_instance(self):
        # Round Robin Load Balancing
        if not self.instances:
            raise Exception("No instances available")
        instance = self.instances[self.index]
        self.index = (self.index + 1) % len(self.instances)
        return instance

def load_config(path):
    if not os.path.exists(path):
        logging.warning(f"Config file {path} not found. Generatng default template.")
        default_config = {
            "instance_alpha": {
                "api_key": "YOUR_API_KEY_1",
                "endpoint": "https://generativelanguage.googleapis.com/v1beta",
                "model": "gemini-1.5-flash",
                "timeout": 10
            },
            "instance_beta": {
                "api_key": "YOUR_API_KEY_2",
                "endpoint": "https://generativelanguage.googleapis.com/v1beta",
                "model": "gemini-1.5-pro",
                "timeout": 15
            }
        }
        with open(path, 'w') as f:
            json.dump(default_config, f, indent=4)
        return default_config
    
    with open(path, 'r') as f:
        return json.load(f)

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    default_config_path = os.path.join(base_dir, "instances_config.json")
    
    parser = argparse.ArgumentParser(description="Gemini Dual-Core Instance Manager")
    parser.add_argument("--prompt", type=str, help="Single prompt to dispatch")
    parser.add_argument("--batch-file", type=str, help="File containing list of prompts")
    parser.add_argument("--count", type=int, default=4, help="Number of random test prompts to generate if no input provided")
    parser.add_argument("--config", type=str, default=default_config_path, help="Path to configuration file")
    
    args = parser.parse_args()
    
    print(f"Loading configuration from {args.config}...")
    config = load_config(args.config)
    
    instances = []
    for name, cfg in config.items():
        instances.append(GeminiInstance(name, cfg))
        
    print(f"Initialized {len(instances)} instances: {[i.name for i in instances]}")
    
    balancer = LoadBalancer(instances)
    prompts = []

    if args.prompt:
        prompts.append(args.prompt)
    elif args.batch_file and os.path.exists(args.batch_file):
        with open(args.batch_file, 'r') as f:
            prompts = [line.strip() for line in f if line.strip()]
    else:
        print(f"No prompt provided. Generating {args.count} test prompts.")
        prompts = [f"Test Task #{i+1} for load balancing verification" for i in range(args.count)]

    print(f"\n--- Dispatching {len(prompts)} Requests ---")

    # Use ThreadPoolExecutor to run requests in parallel across instances
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(instances)) as executor:
        futures = []
        for prompt in prompts:
            target_instance = balancer.get_next_instance()
            # We submit the task to the pool
            futures.append(executor.submit(target_instance.send_request, prompt))
            
        # Collect results as they complete
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            print(f" > {result['response']}")

    print("\n--- All Tasks Completed ---")

if __name__ == "__main__":
    main()
