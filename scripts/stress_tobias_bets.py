# FULLY AI GENERATED
#!/usr/bin/env python3
import argparse
import json
import random
import re
import string
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlencode


DEFAULT_API = "http://localhost:5001"
DEFAULT_USERS = 100
DEFAULT_CONCURRENCY = 25
DEFAULT_BET_CONCURRENCY = 1
DEFAULT_BET_RETRIES = 6
PASSWORD = "stresspass123"


def curl_json(method, url, body=None, token=None):
    command = [
        "curl",
        "-sS",
        "-X",
        method,
        "-H",
        "Accept: application/json",
        "-H",
        "Content-Type: application/json",
        "-A",
        "curl/8.7.1",
        "-w",
        "\nHTTP_STATUS:%{http_code}",
        url,
    ]

    if token:
        command.extend(["-H", f"Authorization: Bearer {token}"])

    if body is not None:
        command.extend(["--data-raw", json.dumps(body)])

    result = subprocess.run(command, capture_output=True, text=True, check=False)
    output = result.stdout.strip()

    if "HTTP_STATUS:" not in output:
        raise RuntimeError(result.stderr.strip() or "curl request failed")

    raw_body, raw_status = output.rsplit("HTTP_STATUS:", 1)
    status = int(raw_status.strip())
    raw_body = raw_body.strip()
    data = json.loads(raw_body) if raw_body else {}

    return status, data


def get_markets(api_base, status="open"):
    # GET /api/markets?status=open
    query = urlencode({"status": status})
    code, data = curl_json("GET", f"{api_base}/api/markets?{query}")
    if code != 200:
        raise RuntimeError(f"GET /api/markets failed: HTTP {code} {data}")
    return data.get("markets", [])


def get_market(api_base, market_id):
    # GET /api/markets/:id
    code, data = curl_json("GET", f"{api_base}/api/markets/{market_id}")
    if code != 200:
        raise RuntimeError(f"GET /api/markets/{market_id} failed: HTTP {code} {data}")
    return data["market"]


def register_user(api_base, email, username):
    # POST /api/auth/register
    code, data = curl_json("POST", f"{api_base}/api/auth/register", {
        "email": email,
        "password": PASSWORD,
        "username": username,
    })
    if code != 201:
        raise RuntimeError(f"POST /api/auth/register failed for {email}: HTTP {code} {data}")
    return data["token"]


def place_bet(api_base, token, market_id, option_id, amount, retries=DEFAULT_BET_RETRIES):
    # POST /api/bets
    for attempt in range(retries + 1):
        code, data = curl_json("POST", f"{api_base}/api/bets", {
            "market_id": market_id,
            "option_id": option_id,
            "amount": amount,
        }, token=token)
        if code == 201:
            return data

        if code not in (0, 429, 500, 502, 503, 504) or attempt == retries:
            raise RuntimeError(f"POST /api/bets failed: HTTP {code} {data}")

        time.sleep((0.25 * (attempt + 1)) + random.uniform(0, 0.25))


def find_market_by_regex(api_base, market_regex):
    pattern = re.compile(market_regex, re.IGNORECASE)

    for market in get_markets(api_base, "open"):
        text = " ".join([
            str(market.get("market_name") or ""),
            str(market.get("description") or ""),
            str(market.get("category") or ""),
        ])

        if pattern.search(text):
            return get_market(api_base, market["id"])

    raise RuntimeError(f"No open market matched regex: {market_regex}")


def random_suffix(length=8):
    alphabet = string.ascii_lowercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


def make_user(api_base, run_id, index):
    email = f"stress{run_id}{index:03d}{random_suffix(4)}@g.ucla.edu"
    username = f"stress{index:03d}{random_suffix(5)}"[:20]
    token = register_user(api_base, email, username)

    return {
        "email": email,
        "username": username,
        "token": token,
    }


def make_bet(api_base, market, user, min_bet, max_bet, bet_retries):
    option = random.choice(market["options"])
    amount = random.randint(min_bet, max_bet)
    result = place_bet(api_base, user["token"], market["id"], option["id"], amount, bet_retries)

    return {
        "email": user["email"],
        "username": user["username"],
        "option": option["label"],
        "amount": amount,
        "balance": result.get("balance"),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default=DEFAULT_API)
    parser.add_argument("--market-regex", default="tobias|professor")
    parser.add_argument("--users", type=int, default=DEFAULT_USERS)
    parser.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY)
    parser.add_argument("--bet-concurrency", type=int, default=DEFAULT_BET_CONCURRENCY)
    parser.add_argument("--bet-retries", type=int, default=DEFAULT_BET_RETRIES)
    parser.add_argument("--min-bet", type=int, default=1)
    parser.add_argument("--max-bet", type=int, default=100)
    args = parser.parse_args()

    if args.users < 1:
        print("--users must be at least 1", file=sys.stderr)
        return 1
    if args.concurrency < 1:
        print("--concurrency must be at least 1", file=sys.stderr)
        return 1
    if args.bet_concurrency < 1:
        print("--bet-concurrency must be at least 1", file=sys.stderr)
        return 1
    if args.bet_retries < 0:
        print("--bet-retries must be at least 0", file=sys.stderr)
        return 1
    if args.min_bet < 1 or args.max_bet < args.min_bet:
        print("invalid bet range", file=sys.stderr)
        return 1

    api_base = args.api.rstrip("/")
    market = find_market_by_regex(api_base, args.market_regex)
    options = market.get("options") or []

    if not options:
        print("matched market has no options", file=sys.stderr)
        return 1

    run_id = str(int(time.time()))
    users = []
    successes = []
    failures = []

    print(f"API: {api_base}")
    print(f"Market: #{market['id']} {market['market_name']}")
    print(f"Options: {', '.join(option['label'] for option in options)}")
    print(f"Users: {args.users}")
    print(f"Registration concurrency: {args.concurrency}")
    print(f"Bet concurrency: {args.bet_concurrency}")

    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [
            executor.submit(
                make_user,
                api_base,
                run_id,
                index,
            )
            for index in range(args.users)
        ]

        for future in as_completed(futures):
            try:
                user = future.result()
                users.append(user)
                print(f"REGISTERED {user['email']}")
            except Exception as err:
                failures.append(str(err))
                print(f"REGISTER FAIL {err}", file=sys.stderr)

    with ThreadPoolExecutor(max_workers=args.bet_concurrency) as executor:
        futures = [
            executor.submit(
                make_bet,
                api_base,
                market,
                user,
                args.min_bet,
                args.max_bet,
                args.bet_retries,
            )
            for user in users
        ]

        for future in as_completed(futures):
            try:
                result = future.result()
                successes.append(result)
                print(f"BET OK {result['email']} ${result['amount']} on {result['option']}")
            except Exception as err:
                failures.append(str(err))
                print(f"BET FAIL {err}", file=sys.stderr)

    print("\nSummary")
    print(f"Successes: {len(successes)}")
    print(f"Failures: {len(failures)}")
    print(f"Total bet: ${sum(result['amount'] for result in successes)}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
