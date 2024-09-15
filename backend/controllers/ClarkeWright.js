
class ClarkeWright {
    constructor(locations, driverLocation, distances) {
        this.locations = locations; // List of locations including orders
        this.driverLocation = driverLocation; // Location of the driver
        this.distances = distances; // Pre-calculated distances
        this.routes = [];
    }

    getSavings() {
        const savings = [];
        for (let i = 0; i < this.locations.length; i++) {
            for (let j = i + 1; j < this.locations.length; j++) {
                const locA = this.locations[i];
                const locB = this.locations[j];
                const distanceAtoB = this.distances[`${i}-${j}`] || this.calculateDistance(locA, locB);
                const savingsValue = (this.distances[`${this.driverLocation}-${i}`] || this.calculateDistance(this.driverLocation, locA) +
                                      this.distances[`${this.driverLocation}-${j}`] || this.calculateDistance(this.driverLocation, locB)) -
                                      distanceAtoB;
                savings.push({ locA, locB, savingsValue });
            }
        }
        return savings.sort((a, b) => b.savingsValue - a.savingsValue);
    }

    calculateDistance(loc1, loc2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(loc2.lat - loc1.lat);
        const dLng = this.deg2rad(loc2.lng - loc1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.deg2rad(loc1.lat)) * Math.cos(this.deg2rad(loc2.lat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; // Distance in meters
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    createRoutes() {
        const savings = this.getSavings();
        const routes = this.locations.map(location => ({
            location,
            visited: false
        }));

        savings.forEach(({ locA, locB }) => {
            const routeA = routes.find(route => route.location === locA);
            const routeB = routes.find(route => route.location === locB);

            if (routeA && routeB && !routeA.visited && !routeB.visited) {
                routeA.visited = true;
                routeB.visited = true;
                this.routes.push([this.driverLocation, locA, locB, this.driverLocation]);
            }
        });

        // Add remaining unvisited locations
        const remainingLocations = routes.filter(route => !route.visited).map(route => route.location);
        if (remainingLocations.length) {
            this.routes.push([this.driverLocation, ...remainingLocations, this.driverLocation]);
        }

        return this.routes;
    }
}

module.exports = ClarkeWright;