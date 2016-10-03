# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/trusty64"

  config.vm.define "vm1" do |vm1|
    vm1.vm.network "private_network", ip: "192.168.5.2"

    vm1.vm.provider "virtualbox" do |v|
      v.memory = 1537
      v.cpus = 2
    end
  end

  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "play-vagrant.yml"
    ansible.groups = {
      "video" => ["vm1"]
    }
  end

end
